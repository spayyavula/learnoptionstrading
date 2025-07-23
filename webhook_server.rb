require 'sinatra'
require 'stripe'
require 'json'
require 'dotenv/load'
require_relative 'project/supabase/StripePaymentDBTX'

# Initialize Stripe with your secret key
Stripe.api_key = ENV['STRIPE_SECRET_KEY']

# Configure server settings
configure do
  set :port, 4242
  set :bind, '0.0.0.0'
  set :server, :webrick  # Use WEBrick (no native dependencies)
  enable :logging
end

# Configure for different environments
configure :development do
  set :show_exceptions, true
  set :dump_errors, true
end

configure :production do
  set :show_exceptions, false
  set :dump_errors, false
end

# Health check endpoint
get '/health' do
  content_type :json
  server_info = {
    status: 'ok',
    timestamp: Time.now,
    server: settings.server,
    environment: settings.environment
  }
  server_info.to_json
end

# Root endpoint
get '/' do
  content_type :json
  {
    message: 'Stripe Webhook Server',
    server: settings.server,
    endpoints: ['/webhook', '/health']
  }.to_json
end

# Webhook endpoint
post '/webhook' do
  payload = request.body.read
  sig_header = request.env['HTTP_STRIPE_SIGNATURE']
  endpoint_secret = ENV['STRIPE_WEBHOOK_SECRET']
  
  puts "📡 [#{settings.server}] Received webhook with signature: #{sig_header&.slice(0, 20)}..."
  
  # Verify webhook signature
  event = nil
  begin
    event = Stripe::Webhook.construct_event(
      payload, sig_header, endpoint_secret
    )
    puts "✅ Webhook signature verified"
  rescue JSON::ParserError => e
    puts "❌ Invalid payload: #{e.message}"
    status 400
    return { error: 'Invalid payload' }.to_json
  rescue Stripe::SignatureVerificationError => e
    puts "❌ Invalid signature: #{e.message}"
    status 400
    return { error: 'Invalid signature' }.to_json
  end

  # Handle the event
  puts "📦 Processing event: #{event['type']}"
  
  begin
    case event['type']
    when 'payment_intent.succeeded'
      StripePaymentDBTX.handle_payment_success(event['data']['object'])
      
    when 'customer.subscription.created'
      StripePaymentDBTX.handle_subscription_created(event['data']['object'])
      
    when 'customer.subscription.updated'
      subscription = event['data']['object']
      puts "🔄 Subscription updated: #{subscription['id']}"
      
    when 'customer.subscription.deleted'
      subscription = event['data']['object']
      puts "❌ Subscription cancelled: #{subscription['id']}"
      
    when 'invoice.payment_succeeded'
      invoice = event['data']['object']
      puts "📄 Invoice payment succeeded: #{invoice['id']}"
      
    when 'invoice.payment_failed'
      invoice = event['data']['object']
      puts "📄 Invoice payment failed: #{invoice['id']}"
      
    else
      puts "⚠️  Unhandled event type: #{event['type']}"
    end
  rescue => e
    puts "❌ Error processing webhook: #{e.message}"
    puts e.backtrace.first(5)
    status 500
    return { error: 'Processing failed' }.to_json
  end

  status 200
  { received: true }.to_json
end

# Server startup message
puts "🚀 Stripe webhook server starting with #{settings.server}"
puts "📡 Webhook endpoint: http://localhost:4242/webhook"
puts "🏥 Health check: http://localhost:4242/health"