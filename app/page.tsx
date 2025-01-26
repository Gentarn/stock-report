"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface StockData {
  code: string
  name: string
  market: string
  price: number
  dividendYield: string
  dividendAmount: number
  marketCap: number
}

export default function Home() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))

  const { data, isLoading, error, refetch } = useQuery<StockData[]>({
    queryKey: ["dividendYield", date],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/dividend-yield?date=${date}`)
        if (Array.isArray(response.data)) {
          return response.data
        } else if (response.data && response.data.error) {
          throw new Error(response.data.error)
        } else {
          throw new Error("Unexpected data format received from API")
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new Error(`API error: ${error.response?.data?.error || error.message}`)
        }
        throw error
      }
    },
    enabled: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    refetch()
  }

  const handleExport = () => {
    if (data) {
      const csv = [
        ["銘柄コード", "銘柄名", "市場名", "株価", "配当利回り", "配当額", "時価総額"],
        ...data.map((item: StockData) => [
          item.code,
          item.name,
          item.market,
          item.price,
          item.dividendYield,
          item.dividendAmount,
          item.marketCap,
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `dividend_yield_report_${date}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>配当利回りトップ100レポート</CardTitle>
          <CardDescription>特定日の配当利回りトップ100銘柄を表示します</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4 mb-4">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
            <Button type="submit">データ取得</Button>
            {data && <Button onClick={handleExport}>CSVエクスポート</Button>}
          </form>

          {isLoading && <p>データを読み込んでいます...</p>}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラーが発生しました</AlertTitle>
              <AlertDescription>
                <p>{(error as Error).message}</p>
                <p className="mt-2">
                  以下の点を確認してください：
                  <ul className="list-disc list-inside mt-2">
                    <li>J-Quants APIの認証情報が正しく設定されているか</li>
                    <li>選択した日付のデータが利用可能か（休日や市場が閉まっている日でないか）</li>
                    <li>インターネット接続が安定しているか</li>
                  </ul>
                  問題が解決しない場合は、管理者にお問い合わせください。
                </p>
              </AlertDescription>
            </Alert>
          )}

          {data && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>銘柄コード</TableHead>
                  <TableHead>銘柄名</TableHead>
                  <TableHead>市場名</TableHead>
                  <TableHead>株価</TableHead>
                  <TableHead>配当利回り(%)</TableHead>
                  <TableHead>配当額</TableHead>
                  <TableHead>時価総額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item: StockData) => (
                  <TableRow key={item.code}>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.market}</TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell>{item.dividendYield}</TableCell>
                    <TableCell>{item.dividendAmount}</TableCell>
                    <TableCell>{item.marketCap}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

