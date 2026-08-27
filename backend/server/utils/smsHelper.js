const axios = require('axios');

const sendOtpSms = async (mobile, otp) => {
  try {
    // Fast2SMS API - India's popular SMS gateway
    const apiKey = process.env.FAST2SMS_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_API_KEY') {
      console.log(`📱 OTP for ${mobile}: ${otp}`);
      return { success: true, test: true };
    }

    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      variables_values: otp,
      route: 'otp',
      numbers: mobile,
    }, {
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
      },
    });

    return { success: true, data: response.data };
  } catch (err) {
  console.error('SMS error status:', err.response?.status);
  console.error('SMS error data:', JSON.stringify(err.response?.data));
  console.log(`📱 OTP for ${mobile}: ${otp}`);
  return { success: false, test: true };
}
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { sendOtpSms, generateOtp };