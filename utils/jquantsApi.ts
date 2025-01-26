import axios from "axios"

axios.interceptors.request.use(request => {
  console.log('Starting Request', JSON.stringify(request, null, 2))
  return request
})

const API_BASE_URL = "https://api.jquants.com/v1"

let accessToken: string | null = null;
let refreshToken: string | null = process.env.JQUANTS_REFRESH_TOKEN || null;

// リフレッシュトークンを永続的に保存する関数
function saveRefreshToken(token: string) {
  process.env.JQUANTS_REFRESH_TOKEN = token;
  // .env.local ファイルに保存
  const fs = require('fs');
  const envPath = '.env.local';
  const envContent = fs.readFileSync(envPath, 'utf8');
  const updatedEnvContent = envContent.replace(
    /JQUANTS_REFRESH_TOKEN=.*/,
    `JQUANTS_REFRESH_TOKEN=${token}`
  );
  fs.writeFileSync(envPath, updatedEnvContent);
}

async function getAccessToken() {
  if (accessToken) return accessToken;

  if (!refreshToken) {
    const email = process.env.JQUANTS_EMAIL;
    const password = process.env.JQUANTS_PASSWORD;

    if (!email || !password) {
      console.error("J-Quants API credentials are not set in environment variables");
      throw new Error("J-Quants API credentials are not set");
    }

    console.log("Attempting to get refresh token...");
    try {
      const response = await axios.post(`${API_BASE_URL}/token/auth_user`, {
        mailaddress: email,
        password: password,
      });

      console.log("Auth User API Response:", JSON.stringify(response.data, null, 2));

      if (!response.data || !response.data.refreshToken) {
        console.error("Unexpected response format from J-Quants API for refresh token");
        throw new Error("Failed to obtain refresh token from J-Quants API");
      }

      refreshToken = response.data.refreshToken;
      // リフレッシュトークンを永続的に保存
      if (refreshToken) {
        saveRefreshToken(refreshToken);
        console.log("Refresh token obtained and saved to .env.local.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error in getRefreshToken:", error.response?.data);
        throw new Error(`Authentication failed (refresh token): ${error.response?.data?.message || error.message}`);
      }
      console.error("Unexpected error in getRefreshToken:", error);
      throw error;
    }
  }

  console.log("Attempting to get access token using refresh token...");
  console.log("Current refreshToken value:", refreshToken); // Add this line
  try {
    const response = await axios.post(`${API_BASE_URL}/token/auth_refresh`, {
      refreshtoken: refreshToken,  // APIが要求するキー名に合わせる
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("Auth Refresh API Response:", JSON.stringify(response.data, null, 2));

    if (!response.data || !response.data.idToken) {
      console.error("Unexpected response format from J-Quants API for ID token");
      throw new Error("Failed to obtain ID token from J-Quants API");
    }

    accessToken = response.data.idToken;
    return accessToken;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error in getAccessToken (refresh token):", error.response?.data);
      throw new Error(`Authentication failed (ID token): ${error.response?.data?.message || error.message}`);
    }
    console.error("Unexpected error in getAccessToken (refresh token):", error);
    throw error;
  }
}

export async function fetchStockData(date: string) {
  const token = await getAccessToken()
  console.log("Fetching stock data for date:", date)
  try {
    const response = await axios.get(`${API_BASE_URL}/prices`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { date },
    })

    console.log("Stock API Response:", JSON.stringify(response.data, null, 2))

    if (!response.data || !Array.isArray(response.data.prices)) {
      console.error("Unexpected data format received from J-Quants API for stock prices")
      throw new Error("Unexpected data format received from J-Quants API for stock prices")
    }

    return response.data.prices
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error in fetchStockData:", error.response?.data)
      throw new Error(`Failed to fetch stock data: ${error.response?.data?.message || error.message}`)
    }
    console.error("Unexpected error in fetchStockData:", error)
    throw error
  }
}

export async function fetchDividendData(date: string) {
  const token = await getAccessToken()
  console.log("Fetching dividend data for date:", date)
  try {
    const response = await axios.get(`${API_BASE_URL}/dividends`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { date },
    })

    console.log("Dividend API Response:", JSON.stringify(response.data, null, 2))

    if (!response.data || !Array.isArray(response.data.dividends)) {
      console.error("Unexpected data format received from J-Quants API for dividends")
      throw new Error("Unexpected data format received from J-Quants API for dividends")
    }

    return response.data.dividends
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error in fetchDividendData:", error.response?.data)
      throw new Error(`Failed to fetch dividend data: ${error.response?.data?.message || error.message}`)
    }
    console.error("Unexpected error in fetchDividendData:", error)
    throw error
  }
}

