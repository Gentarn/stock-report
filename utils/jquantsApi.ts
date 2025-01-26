import axios from "axios"

const API_BASE_URL = "https://api.jquants.com/v1"

let accessToken: string | null = null

async function getAccessToken() {
  if (accessToken) return accessToken

  const email = process.env.JQUANTS_EMAIL
  const password = process.env.JQUANTS_PASSWORD

  if (!email || !password) {
    console.error("J-Quants API credentials are not set in environment variables")
    throw new Error("J-Quants API credentials are not set")
  }

  console.log("Attempting to get access token...")
  try {
    const response = await axios.post(`${API_BASE_URL}/token/auth`, {
      mailaddress: email,
      password: password,
    })

    console.log("Auth API Response:", JSON.stringify(response.data, null, 2))

    if (!response.data || !response.data.token) {
      console.error("Unexpected response format from J-Quants API")
      throw new Error("Failed to obtain access token from J-Quants API")
    }

    accessToken = response.data.token
    return accessToken
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error in getAccessToken:", error.response?.data)
      throw new Error(`Authentication failed: ${error.response?.data?.message || error.message}`)
    }
    console.error("Unexpected error in getAccessToken:", error)
    throw error
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

