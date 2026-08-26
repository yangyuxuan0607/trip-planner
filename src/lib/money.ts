// 金額格式跟著幣別走，不跟著介面語言走（旅行帳本用的是目的地貨幣，不是使用者語言）
const CURRENCY_FORMAT_LOCALE: Record<string, string> = {
  JPY: "ja-JP",
  MYR: "en-MY",
  USD: "en-US",
  TWD: "zh-TW",
  CNY: "zh-CN",
};

export function formatCurrency(amount: number, currency = "JPY") {
  const locale = CURRENCY_FORMAT_LOCALE[currency] ?? "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * 把 amount 平均分給 participantIds，處理除不盡的情況：
 * 餘數依序分給前面的人 1 元，確保加總一定等於 amount。
 */
export function splitEvenly(amount: number, participantIds: string[]): Record<string, number> {
  const n = participantIds.length;
  if (n === 0) return {};
  const base = Math.floor(amount / n);
  const remainder = amount - base * n;
  const shares: Record<string, number> = {};
  participantIds.forEach((id, i) => {
    shares[id] = base + (i < remainder ? 1 : 0);
  });
  return shares;
}

export type Balance = { userId: string; balance: number };
export type Transfer = { fromUserId: string; toUserId: string; amount: number };

/**
 * 依淨餘額算出最少轉帳次數的結算建議 (greedy debt simplification)。
 * balance > 0 代表該人應該收到錢，balance < 0 代表該人要付錢。
 */
export function settle(balances: Balance[]): Transfer[] {
  const creditors = balances
    .filter((b) => b.balance > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance);
  const debtors = balances
    .filter((b) => b.balance < 0)
    .map((b) => ({ userId: b.userId, balance: -b.balance }))
    .sort((a, b) => b.balance - a.balance);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].balance, creditors[j].balance);
    if (pay > 0) {
      transfers.push({ fromUserId: debtors[i].userId, toUserId: creditors[j].userId, amount: pay });
    }
    debtors[i].balance -= pay;
    creditors[j].balance -= pay;
    if (debtors[i].balance === 0) i++;
    if (creditors[j].balance === 0) j++;
  }
  return transfers;
}
