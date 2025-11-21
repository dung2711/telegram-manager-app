// app/page.jsx – Homepage đẹp nhất từ trước đến nay, màu tím chuẩn 2025
import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>

      {/* Navbar */}
      <nav style={{
        padding: '1.5rem 5%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white',
        borderBottom: '1px solid #f0e6ff',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(139,92,246,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #9333ea, #c084fc)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '26px',
            fontWeight: 'bold',
            boxShadow: '0 10px 25px rgba(147,51,234,0.4)'
          }}>
            TG
          </div>
          <h1 style={{
            fontSize: '30px',
            fontWeight: '900',
            background: 'linear-gradient(90deg, #6b21b9, #a855f7)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
          }}>
            TG Manager
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/login" style={{
            padding: '12px 28px',
            border: '2px solid #e9d5ff',
            borderRadius: '14px',
            color: '#9333ea',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'all 0.3s'
          }}>
            Đăng nhập
          </Link>
          <Link href="/register" style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #9333ea, #c084fc)',
            color: 'white',
            borderRadius: '14px',
            fontWeight: '700',
            textDecoration: 'none',
            boxShadow: '0 8px 25px rgba(147,51,234,0.35)'
          }}>
            Đăng ký miễn phí
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{
        textAlign: 'center',
        padding: '130px 20px 100px',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: '62px',
          fontWeight: '900',
          marginBottom: '28px',
          lineHeight: '1.15',
          color: '#581c87'
        }}>
          Quản lý nhóm Telegram<br />          
        </h2>

        <p style={{
          fontSize: '22px',
          color: '#6b7280',
          marginBottom: '60px',
          lineHeight: '1.7'
        }}>
          Tạo nhóm, thêm thành viên, thống kê chi tiết...<br />
        </p>

        {/* Nút chính */}
        <div style={{ display: 'flex', gap: '28px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{
            padding: '22px 56px',
            background: 'linear-gradient(135deg, #9333ea, #c084fc)',
            color: 'white',
            borderRadius: '20px',
            fontSize: '24px',
            fontWeight: '800',
            textDecoration: 'none',
            boxShadow: '0 20px 40px rgba(147,51,234,0.4)',
            transition: 'all 0.3s'
          }}>
            Bắt đầu miễn phí ngay
          </Link>
          <Link href="/login" style={{
            padding: '22px 56px',
            background: '#f3e8ff',
            color: '#9333ea',
            borderRadius: '20px',
            fontSize: '22px',
            fontWeight: '700',
            textDecoration: 'none',
            border: 'none',
            boxShadow: '0 10px 30px rgba(147,51,234,0.15)'
          }}>
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>
      </main>

      {/* Features */}
      <section style={{
        padding: '100px 5%',
        background: 'linear-gradient(to bottom, #fafafa, #f3e8ff15)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '40px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {[
            { icon: 'Lightning', title: 'Tạo nhóm chỉ 3 giây', color: '#fbbf24' },
            { icon: 'Users', title: 'Thêm hàng nghìn thành viên', color: '#34d399' },
            { icon: 'Chart', title: 'Thống kê chi tiết từng ngày', color: '#60a5fa' }
          ].map((item, i) => (
            <div key={i} style={{
              background: 'white',
              padding: '48px 32px',
              borderRadius: '24px',
              textAlign: 'center',
              boxShadow: '0 15px 35px rgba(139,92,246,0.12)',
              transition: 'transform 0.3s'
            }}>
              <div style={{
                fontSize: '64px',
                marginBottom: '20px',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
              }}>
                {item.icon}
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#581c87',
                marginBottom: '12px'
              }}>
                {item.title}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: '#94a3b8',
        background: 'white',
        borderTop: '1px solid #f0e6ff'
      }}>
        © 2025 <strong>TG Manager</strong> • Project 1 
      </footer>
    </div>
  );
}