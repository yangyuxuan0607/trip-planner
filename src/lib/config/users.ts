/**
 * 三位固定使用者的設定來源。
 * 要修改姓名 / PIN / 頭像文字 / 代表色，只需要改這個檔案，然後重新執行 `npm run db:seed`。
 * PIN 只會在這裡以明碼出現，寫入資料庫時一律會雜湊 (bcrypt)，不會回傳給前端。
 */
export type SeedUser = {
  id: string;
  name: string;
  pin: string;
  avatarText: string;
  color: string;
};

export const SEED_USERS: SeedUser[] = [
  { id: "user-me", name: "yang", pin: "1234", avatarText: "Y", color: "#8a7458" },
  { id: "user-a", name: "wong", pin: "2580", avatarText: "W", color: "#6f7d5e" },
  { id: "user-b", name: "kogo", pin: "3697", avatarText: "K", color: "#9c5b52" },
];
