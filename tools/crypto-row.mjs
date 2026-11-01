// Maps one CoinGecko market row to a snapshot row. A missing 1hr change stays null:
// writing 0 would present "no data" as a real, flat return.
export function snapshotRow(coin) {
  return {
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    priceAud: coin.current_price,
    marketCapAud: coin.market_cap,
    volume24hAud: coin.total_volume,
    change1h: coin.price_change_percentage_1h_in_currency ?? null,
    change24h: coin.price_change_percentage_24h ?? 0,
    rank: coin.market_cap_rank,
    image: coin.image || '',
    sparkline_in_7d: coin.sparkline_in_7d || { price: [] }
  };
}
