require 'sinatra'
require 'json'

# Set port
set :port, 4242

# Simple health check
get '/health' do
  content_type :json
  { status: 'ok', time: Time.now }.to_json
end

# Simple webhook endpoint
post '/webhook' do
  puts "📡 Received webhook!"
  puts "Headers: #{request.env.select { |k, v| k.start_with?('HTTP_') }}"
  puts "Body: #{request.body.read}"
  
  status 200
  { received: true }.to_json
end

puts "🚀 Simple webhook server starting on port 4242"
puts "📡 Test it at: http://localhost:4242/health"