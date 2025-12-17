# CELPIP AI Tutor - Backend API

Bu repo CELPIP AI Tutor uygulamasının backend API'sini içerir.

## 🚀 Railway ile Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

## 🔧 Environment Variables

Railway'de şu değişkenleri ayarlayın:

| Değişken | Açıklama |
|----------|----------|
| `PORT` | 3001 (Railway otomatik ayarlar) |
| `JWT_SECRET` | Rastgele güçlü bir string |
| `GEMINI_API_KEY` | Google AI Studio'dan alın |
| `STRIPE_SECRET_KEY` | Stripe Dashboard'dan |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard'dan |
| `STRIPE_PRICE_MONTHLY` | Stripe ürün fiyat ID'si |
| `FRONTEND_URL` | Frontend URL'niz |

## 📡 API Endpoints

- `GET /api/health` - Sağlık kontrolü
- `POST /api/auth/register` - Kayıt
- `POST /api/auth/login` - Giriş
- `GET /api/tasks/available` - Mevcut tasklar
- `POST /api/tasks/evaluate/writing` - Yazı değerlendirme
- `POST /api/tasks/evaluate/speaking` - Konuşma değerlendirme
- `POST /api/payments/create-checkout` - Ödeme başlat

## 📝 Lisans

MIT
