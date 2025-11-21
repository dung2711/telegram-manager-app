// app/login/page.jsx
"use client";   // ← DÒNG QUAN TRỌNG NHẤT – BẮT BUỘC PHẢI CÓ!

import Link from 'next/link';

export default function LoginPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('isLoggedIn', 'true');
    alert('Đăng nhập thành công!');
    window.location.href = '/.';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8f5ff 0%, #ede9fe 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        padding: '3.5rem 3rem',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(139,92,246,0.15)',
        width: '100%',
        maxWidth: '440px',
        border: '1px solid #e9d5ff'
      }}>
        {/* Logo + Tiêu đề */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '38px',
            fontWeight: 'bold',
            marginBottom: '1rem',
            boxShadow: '0 10px 25px rgba(139,92,246,0.3)'
          }}>
            TG
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#6b46c1' }}>
            Chào mừng trở lại!
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '16px' }}>
            Đăng nhập để quản lý nhóm Telegram
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4c1d95' }}>
              Email hoặc tên đăng nhập
            </label>
            <input
              type="text"
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '1rem 1.2rem',
                borderRadius: '14px',
                border: '2px solid #e9d5ff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4c1d95' }}>
              Mật khẩu
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '1rem 1.2rem',
                borderRadius: '14px',
                border: '2px solid #e9d5ff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: '1rem',
              padding: '1.1rem',
              background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(139,92,246,0.4)',
              transition: 'all 0.3s'
            }}
          >
            Đăng nhập ngay
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', color: '#94a3b8' }}>
          Chưa có tài khoản?{' '}
          <Link href="/register" style={{ color: '#8b5cf6', fontWeight: '600', textDecoration: 'none' }}>
            Đăng ký miễn phí
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link href="/" style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none' }}>
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}