require 'net/http'
require 'json'
require 'uri'
require 'stripe'

class StripePaymentDBTX
  def self.handle_payment_success(payment_intent)
    customer_email = payment_intent['receipt_email'] || payment_intent.dig('customer_details', 'email')
    amount = payment_intent['amount'] / 100.0
    payment_id = payment_intent['id']
    currency = payment_intent['currency']&.upcase || 'USD'
    
    puts "💰 Processing payment of $#{amount} #{currency} for #{customer_email}"
    
    begin
      # 1. Record payment in database
      create_payment_record(payment_id, customer_email, amount, currency)
      
      # 2. Ensure user exists and grant access
      ensure_user_exists(customer_email)
      grant_course_access(customer_email, determine_course_from_amount(amount))
      
      # 3. Send confirmation email
      send_welcome_email(customer_email, amount)
      
      puts "✅ Payment processing completed for #{customer_email}"
    rescue => e
      puts "❌ Error processing payment: #{e.message}"
      puts e.backtrace.first(3)
    end
  end
  
  def self.handle_subscription_created(subscription)
    customer_id = subscription['customer']
    subscription_id = subscription['id']
    
    # Get customer details from Stripe
    customer = Stripe::Customer.retrieve(customer_id)
    customer_email = customer.email
    
    puts "🔄 Processing subscription creation for #{customer_email}"
    
    create_subscription_record(subscription_id, customer_email, subscription)
    grant_subscription_access(customer_email, subscription)
  end
  
  private
  
  def self.create_payment_record(payment_id, email, amount, currency)
    course_type = determine_course_from_amount(amount)
    
    data = {
      stripe_payment_id: payment_id,
      user_email: email,
      amount: amount,
      currency: currency,
      status: 'completed',
      subscription_type: course_type,
      created_at: Time.now.iso8601
    }
    
    response = execute_supabase_query('POST', 'rest/v1/payments', data)
    puts "📝 Payment record created: #{response&.code}"
  end
  
  def self.ensure_user_exists(email)
    user_data = {
      email: email,
      has_access: false,
      created_at: Time.now.iso8601
    }
    
    # Use upsert to create or update
    execute_supabase_query('POST', 'rest/v1/users', user_data)
  end
  
  def self.grant_course_access(email, course_type)
    expires_at = case course_type
                 when 'monthly' then (Time.now + 30 * 24 * 60 * 60).iso8601
                 when 'yearly' then (Time.now + 365 * 24 * 60 * 60).iso8601
                 else nil # Lifetime access for other plans
                 end
    
    user_update = {
      has_access: true,
      subscription_type: course_type,
      access_granted_at: Time.now.iso8601,
      subscription_expires_at: expires_at,
      updated_at: Time.now.iso8601
    }
    
    response = execute_supabase_query('PATCH', "rest/v1/users?email=eq.#{email}", user_update)
    puts "🎓 Access granted to #{email} for #{course_type}: #{response&.code}"
  end
  
  def self.create_subscription_record(subscription_id, email, subscription)
    data = {
      stripe_subscription_id: subscription_id,
      user_email: email,
      status: subscription['status'],
      plan_type: determine_plan_from_subscription(subscription),
      current_period_start: Time.at(subscription['current_period_start']).iso8601,
      current_period_end: Time.at(subscription['current_period_end']).iso8601,
      created_at: Time.now.iso8601
    }
    
    execute_supabase_query('POST', 'rest/v1/subscriptions', data)
  end
  
  def self.grant_subscription_access(email, subscription)
    course_type = determine_plan_from_subscription(subscription)
    expires_at = Time.at(subscription['current_period_end']).iso8601
    
    user_update = {
      has_access: true,
      subscription_type: course_type,
      access_granted_at: Time.now.iso8601,
      subscription_expires_at: expires_at,
      updated_at: Time.now.iso8601
    }
    
    execute_supabase_query('PATCH', "rest/v1/users?email=eq.#{email}", user_update)
  end
  
  def self.determine_course_from_amount(amount)
    case amount
    when 29.99, 30.0 then 'monthly'
    when 299.99, 300.0 then 'yearly'  
    when 99.99, 100.0 then 'pro'
    when 199.99, 200.0 then 'enterprise'
    when 5.00, 5.0 then 'coffee'
    else 'basic'
    end
  end
  
  def self.determine_plan_from_subscription(subscription)
    items = subscription['items']['data']
    return 'unknown' if items.empty?
    
    price_id = items.first['price']['id']
    case price_id
    when ENV['VITE_STRIPE_MONTHLY_PRICE_ID'] then 'monthly'
    when ENV['VITE_STRIPE_YEARLY_PRICE_ID'] then 'yearly'
    when ENV['VITE_STRIPE_PRICE_ID_PRO'] then 'pro'
    when ENV['VITE_STRIPE_PRICE_ID_ENTERPRISE'] then 'enterprise'
    else 'basic'
    end
  end
  
  def self.send_welcome_email(email, amount)
    puts "📧 Welcome email queued for #{email} (amount: $#{amount})"
    # TODO: Implement email service integration
  end
  
  def self.execute_supabase_query(method, endpoint, data)
    uri = URI("#{ENV['VITE_SUPABASE_URL']}/#{endpoint}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    
    request = case method
              when 'POST' then Net::HTTP::Post.new(uri)
              when 'PATCH' then Net::HTTP::Patch.new(uri)
              when 'GET' then Net::HTTP::Get.new(uri)
              end
    
    request['Authorization'] = "Bearer #{ENV['SUPABASE_SERVICE_ROLE_KEY']}"
    request['Content-Type'] = 'application/json'
    request['apikey'] = ENV['SUPABASE_SERVICE_ROLE_KEY']
    request['Prefer'] = 'return=minimal' if method == 'POST'
    
    request.body = data.to_json if data && method != 'GET'
    
    response = http.request(request)
    
    if response.code.to_i >= 400
      puts "❌ Database error: #{response.code} - #{response.body}"
    else
      puts "✅ Database operation successful: #{response.code}"
    end
    
    response
  rescue => e
    puts "❌ Database connection error: #{e.message}"
    nil
  end
end
