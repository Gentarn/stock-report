import { NextResponse } from "next/server"
import { fetchStockData, fetchDividendData } from "@/utils/jquantsApi"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")

  if (!date) {
    return NextResponse.json({ error: "Date parameter is required" }, { status: 400 })
  }

  try {
    console.log("Fetching data for date:", date)
    const [stockData, dividendData] = await Promise.all([fetchStockData(date), fetchDividendData(date)])

    console.log("Stock data count:", stockData.length)
    console.log("Dividend data count:", dividendData.length)

    if (stockData.length === 0 || dividendData.length === 0) {
      return NextResponse.json({ error: "No data available for the selected date" }, { status: 404 })
    }

    const combinedData = stockData.map((stock: any) => {
      const dividend = dividendData.find((div: any) => div.Code === stock.Code)
      const dividendYield = dividend && stock.Close > 0 ? (dividend.DividendPerShare / stock.Close) * 100 : 0
      return {
        code: stock.Code,
        name: stock.CompanyName,
        market: stock.Market,
        price: stock.Close,
        dividendYield: dividendYield.toFixed(2),
        dividendAmount: dividend ? dividend.DividendPerShare : 0,
        marketCap: stock.MarketCapitalization,
      }
    })

    console.log("Combined data count:", combinedData.length)

    const sortedData = combinedData
      .sort((a: any, b: any) => Number(b.dividendYield) - Number(a.dividendYield))
      .slice(0, 100)

    console.log("Sorted data count:", sortedData.length)

    return NextResponse.json(sortedData)
  } catch (error) {
    console.error("Error in API route:", error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

