# USDT Treasury Multisig Yapısı

## Genel Bakış

USDT Treasury, kullanıcıların gerçek USDT'yi chain'de wUSDT olarak kullanabilmesi için 1:1 backing ile çalışan merkezi bir hazinedir. Güvenlik ve şeffaflık için 3/5 multisig yapısı kullanılır.

---

## 🏛️ Multisig Üyeleri (3/5 Threshold)

| # | Rol | Tiki | Unique | AccountId | Sorumluluk |
|---|-----|------|--------|-----------|------------|
| 1️⃣ | **Founder/Başkan** | Serok | ✅ | `5D74yW53pg3gCaLMzGvZUNxiqTZMwFXA85bB2QYfcYh5Tdc4` | Stratejik liderlik, son karar mercii |
| 2️⃣ | **Meclis Başkanı** | SerokiMeclise | ✅ | `5GTRuK96TkmjUSuQnkjBJBCEmHSDSdW22ptWosxCBWACfsZp` | Yasama kontrolü, demokratik denetim |
| 3️⃣ | **Hazine Müdürü** | Xezinedar | ✅ | `5DRTYPChot1UPDHEeJVTtuE8dLDgCVvAcWbdnc8zwwpYYjeR` | Treasury yönetimi, reserve management |
| 4️⃣ | **Noter** | Noter | ❌ | `5DFwqK698vL4gXHEcanaewnAqhxJ2rjhAogpSTHw3iwGDwd3` | Hukuki belgelendirme, işlem kayıtları |
| 5️⃣ | **Sözcü/Temsilci** | Berdevk | ❌ | `5F4V6dzpe72dE2C7YN3y7VGznMTWPFeSKL3ANhp4XasXjfvj` | İletişim, şeffaflık, topluluk bilgilendirme |

### Açıklama:
- **Unique Roller (3):** Chain'de sadece 1 kişi bu role sahip olabilir (blockchain garantili)
- **Non-Unique Roller (2):** Spesifik, güvenilir kişiler seçilmiştir
- **Threshold:** Her işlem için 5 kişiden 3'ünün onayı gereklidir

---

## 🔐 Güvenlik Katmanları

### 1. Multi-Signature (3/5)
- Tek kişi fonları kontrol edemez
- Minimum 3 kişinin onayı gereklidir
- Gnosis Safe üzerinde şeffaf

### 2. Tiered Withdrawal Limits
| Miktar | Bekleme Süresi | Gerekli İmza | Not |
|--------|----------------|--------------|-----|
| < $1,000 | Anında | 3/5 | Küçük işlemler |
| $1,000 - $10,000 | 1 saat | 3/5 | Orta işlemler |
| > $10,000 | 24 saat | 3/5 | Büyük işlemler - community alert |

### 3. On-Chain Proof of Reserves
- Her saat otomatik kontrol
- Total wUSDT supply = Ethereum'daki USDT balance
- Public dashboard: `https://pezkuwi.com/reserves`

### 4. Insurance Fund
- Swap fee'lerden %10 ayrılır
- Hedef: Total supply'ın %20'si
- Hack/loss durumunda kullanıcıları korur

---

## 📊 İşlem Akışı

### Deposit (USDT → wUSDT)
```
1. Kullanıcı Ethereum'da USDT gönderir
   → Multisig Address: 0x123...

2. Noter işlemi kaydeder
   → Transaction hash, miktar, user address

3. Berdevk public dashboard'u günceller
   → Şeffaflık için

4. 3/5 multisig onayı ile wUSDT mint edilir
   → User Pezkuwi chain'de wUSDT alır

5. Reserves kontrol edilir
   → wUSDT supply ≤ USDT balance
```

### Withdrawal (wUSDT → USDT)
```
1. Kullanıcı chain'de wUSDT burn eder
   → Ethereum address belirtir

2. 24 saat bekleme (>$10K için)
   → Güvenlik önlemi

3. Noter withdrawal request kaydeder
   → Blockchain'de doğrulanabilir

4. 3/5 multisig onayı ile USDT gönderilir
   → Ethereum'da kullanıcıya

5. Berdevk işlemi duyurur
   → Public dashboard + Twitter/Discord
```

---

## 🛡️ Güven Mekanizmaları

### 1. Blockchain Garantili
- İlk 3 kişi **unique roller** → Sadece 1 kişi olabilir
- Chain'de doğrulanabilir
- Değiştirilemez (governance gerekir)

### 2. Hukuki Belgelendirme (Noter)
- Tüm işlemler kayıt altında
- Denetim için trace edilebilir
- Anlaşmazlık durumunda kanıt

### 3. Topluluk Şeffaflığı (Berdevk)
- Her işlem duyurulur
- Public dashboard güncel
- Community feedback

### 4. Proof of Reserves
- Etherscan'de doğrulanabilir
- Her saat otomatik kontrol
- Alert sistemi (under-collateralized ise)

---

## 📍 Ethereum Multisig Detayları

### Gnosis Safe Configuration
- **Network:** Ethereum Mainnet
- **Safe Address:** `0x123...` (TBD)
- **Threshold:** 3/5
- **Owners:**
  - `0xAaa...` (Serok)
  - `0xBbb...` (SerokiMeclise)
  - `0xCcc...` (Xezinedar)
  - `0xDdd...` (Noter)
  - `0xEee...` (Berdevk)

### Public Links
- Etherscan: `https://etherscan.io/address/0x123...`
- Gnosis Safe UI: `https://app.safe.global/eth:0x123...`
- Reserve Dashboard: `https://pezkuwi.com/reserves`

---

## 🎯 Rol Sorumlulukları

### Serok (Founder)
- ✅ Stratejik kararlar
- ✅ Acil durum müdahalesi
- ✅ Governance voting

### SerokiMeclise (Meclis Başkanı)
- ✅ Demokratik kontrol
- ✅ Topluluk temsilciliği
- ✅ Policy oversight

### Xezinedar (Hazine Müdürü)
- ✅ Reserve management
- ✅ Collateral ratio monitoring
- ✅ Financial reporting

### Noter
- ✅ Tüm işlemleri kaydet
- ✅ Hukuki belgeler hazırla
- ✅ Audit trail maintain et

### Berdevk (Sözcü)
- ✅ Public dashboard yönet
- ✅ İşlemleri duyur
- ✅ Community questions cevapla
- ✅ Şeffaflık sağla

---

## 📈 Başarı Metrikleri

### Güven Göstergeleri
- ✅ 3/5 Multisig (Tek kişi kontrolü yok)
- ✅ %102+ Collateralization Ratio
- ✅ Insurance Fund: $XX,XXX
- ✅ Live Reserves: Etherscan'de doğrulanabilir
- ✅ 0 Incidents (hedef)

### Şeffaflık
- ✅ Public dashboard 24/7 aktif
- ✅ Tüm işlemler blockchain'de
- ✅ Aylık audit raporları
- ✅ Community AMAs

---

## 🚀 İlk Kurulum Adımları

### 1. Gnosis Safe Oluştur
```bash
# https://app.safe.global adresine git
1. "Create New Safe" tıkla
2. Ethereum Mainnet seç
3. 5 owner ekle (yukarıdaki adresler)
4. Threshold: 3/5
5. Deploy
```

### 2. USDT Deposit
```bash
# İlk likidite (örnek: $10,000)
1. Gnosis Safe address'e USDT gönder
2. Etherscan'de doğrula
3. Safe balance = $10,000 USDT
```

### 3. Chain'de wUSDT Asset Oluştur
```bash
# Polkadot.js Apps ile
1. Developer → Sudo → assets.create
   - id: 2
   - admin: <multisig_pezkuwi_address>
   - min_balance: 1000000

2. Developer → Sudo → assets.setMetadata
   - id: 2
   - name: "Wrapped USDT"
   - symbol: "wUSDT"
   - decimals: 6
```

### 4. Pool Oluştur
```bash
# wUSDT/PEZ ve wUSDT/wHEZ poolları
1. assetConversion.createPool(1, 2) # PEZ/wUSDT
2. assetConversion.createPool(0, 2) # wHEZ/wUSDT
3. İlk liquidity ekle
```

### 5. Public Dashboard Deploy
```bash
cd DKSweb
# Reserves dashboard component ekle
npm run build
npm run deploy
```

---

## ⚠️ Risk Yönetimi

### Potansiyel Riskler
1. **Multisig Key Loss:** 2/5 key kaybolsa bile 3/5 hala çalışır
2. **Ethereum Gas Fees:** High gas durumunda withdrawaller pahalı
3. **Smart Contract Bug:** Gnosis Safe audited ama risk var
4. **Regulatory:** USDT yasal sorunlar yaşayabilir

### Mitigations
1. ✅ Key backup stratejisi (her owner için)
2. ✅ Gas limit alarms (yüksek gas'da uyar)
3. ✅ Insurance fund (bug durumunda)
4. ✅ Legal counsel (compliance için)

---

## 📞 İletişim

### Public Channels
- Discord: `#usdt-bridge`
- Twitter: `@PezkuwiChain`
- Telegram: `@pezkuwi_reserves`

### Emergency Contact
- Berdevk (Sözcü): `berdevk@pezkuwi.com`
- 24/7 Support: `support@pezkuwi.com`

### Audit & Security
- Bug Bounty: `https://pezkuwi.com/bug-bounty`
- Security Email: `security@pezkuwi.com`

---

**Son Güncelleme:** 2025-11-03
**Versiyon:** 1.0
**Durum:** Planning Phase
