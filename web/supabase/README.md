# Supabase Setup Guide

## Overview

Bu klasör Supabase database setup için gerekli migration dosyalarını içerir.

---

## Quick Start

### 1. Supabase Dashboard'a Giriş

1. https://supabase.com/dashboard adresine gidin
2. PezkuwiChain projesini açın: https://supabase.com/dashboard/project/vsyrpfiwhjvahofxwytr

### 2. SQL Editor'ı Açın

1. Sol menüden **SQL Editor** sekmesine tıklayın
2. **New Query** butonuna tıklayın

### 3. Migration Script'ini Çalıştırın

1. `supabase/migrations/001_initial_schema.sql` dosyasını açın
2. Tüm içeriği kopyalayın
3. Supabase SQL Editor'a yapıştırın
4. Sağ alttaki **Run** butonuna tıklayın

### 4. Sonuçları Kontrol Edin

Migration başarılıysa şu mesajı göreceksiniz:
```
Database schema created successfully!
```

---

## Oluşturulan Tablolar

### 1. `profiles` Tablosu
Kullanıcı profil bilgilerini ve referral verilerini saklar:
- `id` - User ID (auth.users'a reference)
- `username` - Benzersiz kullanıcı adı
- `email` - Email adresi
- `full_name` - Tam ad
- `avatar_url` - Avatar resmi URL'si
- `referred_by` - Referans kodu (kim davet etti)
- `referral_code` - Kendi referans kodu (otomatik oluşturulur)
- `referral_count` - Kaç kişi davet etti
- `total_referral_rewards` - Toplam kazanılan ödüller

### 2. `admin_roles` Tablosu
Admin ve moderator rol atamalarını saklar:
- `id` - Benzersiz ID
- `user_id` - User ID
- `role` - Rol: 'admin', 'super_admin', 'moderator'
- `granted_by` - Rolü kim verdi
- `granted_at` - Ne zaman verildi

### 3. `wallets` Tablosu
Kullanıcı wallet adreslerini saklar:
- `id` - Benzersiz ID
- `user_id` - User ID
- `address` - Wallet adresi
- `network` - Network adı (pezkuwichain, polkadot, etc.)
- `is_primary` - Primary wallet mı?
- `nickname` - Wallet nickname'i

### 4. `referral_history` Tablosu
Referral ödüllerini ve geçmişini takip eder:
- `id` - Benzersiz ID
- `referrer_id` - Davet eden user ID
- `referred_user_id` - Davet edilen user ID
- `referral_code` - Kullanılan referral code
- `reward_amount` - Ödül miktarı
- `reward_token` - Ödül token'ı (PEZ, HEZ, etc.)
- `reward_claimed` - Ödül talep edildi mi?

---

## Automatic Features

### 1. Referral Code Auto-Generation
Her kullanıcı kaydolduğunda otomatik olarak benzersiz 8 karakterli bir referral code oluşturulur.

### 2. Row Level Security (RLS)
Tüm tablolarda RLS etkin:
- Kullanıcılar sadece kendi verilerini görebilir/düzenleyebilir
- Admin'ler admin_roles tablosuna erişebilir
- Public profiller herkes tarafından görülebilir

### 3. Timestamp Updates
Profile güncellendiğinde `updated_at` otomatik olarak güncellenir.

---

## Test Etme

### 1. Sign Up Testi

1. Web uygulamasını başlatın: `npm run dev`
2. `/login` sayfasına gidin
3. **Sign Up** sekmesine tıklayın
4. Yeni kullanıcı bilgilerini girin:
   - Full Name: Test User
   - Email: test@example.com
   - Password: Test1234!
   - Referral Code: (opsiyonel)
5. **Create Account** butonuna tıklayın

### 2. Database'i Kontrol Edin

1. Supabase Dashboard → **Table Editor** sekmesine gidin
2. `profiles` tablosunu seçin
3. Yeni kaydın oluştuğunu doğrulayın
4. `referral_code` alanının otomatik doldurulduğunu kontrol edin

### 3. Login Testi

1. Oluşturduğunuz email ve password ile login olun
2. Başarılı giriş yapabildiğinizi doğrulayın

---

## Admin Rolü Ekleme

Bir kullanıcıya admin rolü vermek için:

1. Supabase Dashboard → **SQL Editor**
2. Şu SQL'i çalıştırın:

```sql
-- Get user ID first
SELECT id, email FROM auth.users WHERE email = 'info@pezkuwichain.io';

-- Then add admin role (replace USER_ID with actual ID)
INSERT INTO public.admin_roles (user_id, role, granted_by)
VALUES ('USER_ID', 'super_admin', 'USER_ID')
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
```

---

## Troubleshooting

### Problem: "relation 'profiles' already exists"

**Çözüm**: Tablolar zaten oluşturulmuş. Sorun yok, devam edebilirsiniz.

### Problem: "duplicate key value violates unique constraint"

**Çözüm**: Bu kayıt zaten var. Normal bir durum.

### Problem: Sign up başarılı ama profile oluşmadı

**Çözüm**:
1. AuthContext.tsx'deki `signUp` fonksiyonunu kontrol edin (line 148-186)
2. Browser console'da hata mesajlarını kontrol edin
3. Supabase Dashboard → **Logs** → **Postgres Logs**'u inceleyin

### Problem: "Invalid JWT token"

**Çözüm**: `.env` dosyasındaki `VITE_SUPABASE_ANON_KEY` değerini kontrol edin.

---

## Security Notes

### 🔒 Row Level Security (RLS)

Tüm tablolar RLS ile korunuyor:
- Kullanıcılar sadece kendi verilerine erişebilir
- Public veriler (profil bilgileri) herkes tarafından görülebilir
- Admin rolleri sadece admin'ler tarafından görülebilir

### 🔑 API Keys

- **anon key**: Frontend'de kullanılır, RLS kurallarına tabidir
- **service_role key**: ASLA frontend'de kullanmayın! Server-side only.

### 📝 Best Practices

1. **Production'da**:
   - `VITE_ENABLE_DEMO_MODE=false` yapın
   - Demo credentials'ları kaldırın
   - Service role key'i asla commit etmeyin

2. **Development'ta**:
   - Test verileri ile çalışın
   - Real user data kullanmayın

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

---

**Last Updated**: 2025-01-28
**Version**: 1.0.0
