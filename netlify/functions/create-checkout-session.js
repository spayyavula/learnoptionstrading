// netlify/functions/create-checkout-session.js
exports.handler = async (event, context) => {
  console.log('🔧 Function called:', event.httpMethod, event.path)
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      message: 'Function is working!',
      timestamp: new Date().toISOString()
    })
  }
}