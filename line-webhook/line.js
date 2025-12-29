'use strict';

const line = require('@line/bot-sdk');
require('dotenv').config();

// Basic configuration (can be updated dynamically)
let config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  ngrokUrl: process.env.NGROK_URL || ''
};

// Create a new LINE SDK client only if token exists
let client = null;
if (config.channelAccessToken && config.channelAccessToken !== '') {
  client = new line.Client(config);
}

/**
 * Updates the LINE configuration dynamically
 * @param {Object} newConfig - New configuration object
 */
const updateConfig = (newConfig) => {
  config = { ...config, ...newConfig };
  if (config.channelAccessToken && config.channelAccessToken !== '') {
    client = new line.Client(config);
    console.log('✅ LINE configuration updated successfully');
  }
};

/**
 * Replies to a message event with a given message object.
 * @param {string} replyToken - The reply token from the webhook event.
 * @param {Object|Object[]} message - The message object or array of message objects to send.
 * @returns {Promise}
 */
const replyMessage = async (replyToken, message) => {
  if (!client) {
    return Promise.reject(new Error('LINE client not initialized. Please configure credentials first.'));
  }
  
  try {
    const result = await client.replyMessage(replyToken, message);
    console.log('✅ Message sent successfully!');
    return result;
  } catch (error) {
    console.error('❌ Failed to send message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

module.exports = { client, replyMessage, config, updateConfig };
