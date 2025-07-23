source 'https://rubygems.org'

gem 'sinatra'
gem 'stripe'
gem 'json'
gem 'dotenv'

# Platform-specific gems
platforms :mingw, :x64_mingw, :mswin do
  gem 'nio4r', '~> 2.5'
  gem 'wdm', '>= 0.1.0'  # Windows Directory Monitor
end

# Web servers
gem 'puma'       # Default, high performance
gem 'thin'       # Lightweight, event-driven
gem 'webrick'    # Built into Ruby
gem 'falcon'     # High performance, async
gem 'rackup'     # For running with different servers

# Development dependencies
group :development do
  gem 'rerun'    # Auto-restart server on file changes
end
