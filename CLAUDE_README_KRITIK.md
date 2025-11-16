# CLAUDE İÇİN KRİTİK BİLGİLER - BUNU ÖNCE OKU!

## ⚠️ ÇOK ÖNEMLİ - DOKUNMA!

Bu sistem günlerdir emek verilerek kurulmuştur. Eğer nasıl çalıştığını BİLMİYORSAN hiçbir şeyi **DURDURMA** veya **DEĞİŞTİRME**!

## MEVCUT ÇALIŞAN SİSTEM

### VPS (37.60.230.9) - pezkuwi-vps

**ÇOK ÖNEMLİ:** VPS'te 7 validator çalışıyor ve blok finalize ediyorlar. **BUNLARA DOKUNMA!**

```bash
# VPS'teki validator durumunu kontrol et:
ssh pezkuwi-vps "ps aux | grep -E '[p]ezkuwi.*validator'"

# Blockchain durumunu kontrol et:
ssh pezkuwi-vps "tail -30 /tmp/validator-1.log | grep -E '(peers|finalized)' | tail -5"
```

**Çalışan validatorlar:**
- VPS-Validator-1 (Bootnode): Port 30333, RPC 9944
- VPS-Validator-2: Port 30334, RPC 9945
- VPS-Validator-3: Port 30335, RPC 9946
- VPS-Validator-4: Port 30336, RPC 9947
- VPS-Validator-5: Port 30337, RPC 9948
- VPS-Validator-6: Port 30338, RPC 9949
- VPS-Validator-7: Port 30339, RPC 9950

**Chain Spec:** `/root/pezkuwi-sdk/chain-specs/beta/beta-testnet-raw.json`

**Başlatma scripti:** `/tmp/start-vps-with-public-addr.sh`

**Bootnode Peer ID:** `12D3KooWRyg1V1ay7aFbHWdpzYMnT3Nk6RLdM8GceqVQzp1GoEgZ`

### Local PC - 8. Validator (Planlanmış)

Local PC'den 8. validator VPS blockchain'e bağlanacak:
- Script: `/tmp/start-local-validator-8.sh`
- Bootnode: `/ip4/37.60.230.9/tcp/30333/p2p/12D3KooWRyg1V1ay7aFbHWdpzYMnT3Nk6RLdM8GceqVQzp1GoEgZ`

## FRONTEND DEPLOYMENT (VPS)

### Production Build Location
```
Kaynak: /home/mamostehp/pwap/web
Build: npm run build
Deploy: /var/www/pezkuwichain/web/dist/
```

### Environment
```
VITE_NETWORK=testnet
VITE_WS_ENDPOINT_TESTNET=wss://ws.pezkuwichain.io
VITE_API_BASE_URL=https://api.pezkuwichain.io/api
```

### Nginx Config
```
Server: /etc/nginx/sites-available/pezkuwichain.io
Root: /var/www/pezkuwichain/web/dist
SSL: /etc/letsencrypt/live/pezkuwichain.io/
```

### WebSocket Proxy
```nginx
location /ws {
    proxy_pass http://127.0.0.1:9944;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

## YASAKLAR - BUNLARI YAPMA!

1. ❌ **VPS'teki validatorları DURDURMA!** Blockchain çalışıyor, bozma!
2. ❌ **Chain spec değiştirme!** `/root/pezkuwi-sdk/chain-specs/beta/beta-testnet-raw.json` kullan
3. ❌ **Blockchain restart etme!** Eğer gerçekten gerekiyorsa ÖNCE KULLANICIYA SOR
4. ❌ **Base path değiştirme!** VPS: `/root/pezkuwi-data/beta-testnet/`
5. ❌ **Varsayımla iş yapma!** Bilmiyorsan SOR!

## SAĞLIKLI BLOCKCHAIN KONTROLÜ

```bash
# 1. VPS'te validator sayısı (7 olmalı)
ssh pezkuwi-vps "ps aux | grep -E '[p]ezkuwi.*validator' | wc -l"

# 2. Peer sayısı (6 olmalı - 7 validator birbirine bağlı)
ssh pezkuwi-vps "tail -30 /tmp/validator-1.log | grep -E 'peers' | tail -1"

# 3. Block finalization (devam ediyor mu?)
ssh pezkuwi-vps "tail -30 /tmp/validator-1.log | grep -E 'finalized' | tail -3"
```

**Sağlıklı output örneği:**
```
💤 Idle (6 peers), best: #5722, finalized #5720, ⬇ 10.0kiB/s ⬆ 21.2kiB/s
```

## FRONTEND DEPLOYMENT ADIM ADIM

```bash
# 1. Local PC'de build (pwap/web klasöründe)
cd /home/mamostehp/pwap/web
npm run build

# 2. VPS'e deploy
rsync -avz dist/ pezkuwi-vps:/var/www/pezkuwichain/web/dist/

# 3. Nginx reload (gerekirse)
ssh pezkuwi-vps "systemctl reload nginx"

# 4. Kontrol
curl -I https://pezkuwichain.io
```

## SORUN GİDERME

### Frontend "connecting network" gösteriyor
1. Blockchain çalışıyor mu kontrol et (yukarıdaki komutlar)
2. WebSocket proxy çalışıyor mu: `curl -I http://37.60.230.9:9944`
3. SSL çalışıyor mu: `curl -I https://pezkuwichain.io`

### Blockchain blok üretmiyor
- **ÖNCE KULLANICIYA SOR!** Kendi başına restart etme!
- Peer sayısını kontrol et
- Session keys set edilmiş mi kontrol et

## CLAUDE, BU KURALLAR SANA:

1. **Eğer bir şey çalışıyorsa DOKUNMA!**
2. **Bilmiyorsan ÖNCE SOR, sonra yap**
3. **Varsayım yapma, kanıt topla**
4. **Kritik işlemlerde ONAY AL**
5. **Bu dosyayı her session başında OKU**

## SON GÜNCELLEME

Tarih: 2025-11-16
Durum: VPS'te 7 validator çalışıyor, blok finalize ediliyor
Son Blok: #5722 (finalized #5720)
Peer Count: 6 peers
