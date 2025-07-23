require 'dotenv/load'
require_relative 'webhook_server'

# Configure for production
configure :production do
  set :logging, true
  set :dump_errors, false
  set :show_exceptions, false
end

run Sinatra::Application