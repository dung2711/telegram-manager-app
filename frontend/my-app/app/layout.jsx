import './global.css';

export const metadata = {
  title: 'TG Manager - Quản lý nhóm Telegram',
  description: 'Web dashboard quản lý nhóm Telegram',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}