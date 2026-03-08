

## Müşteri Onboarding Checklist Sistemi

Müşterilerden dosya, link ve metin bilgisi toplamak için bir checklist tabanlı sistem kurulacak. Admin hazır şablonlar oluşturabilecek, müşteriye özel düzenleyebilecek. Müşteriler kendi panellerinden görevleri tamamlayacak.

### Veritabanı Yapısı

**1. `onboarding_templates` tablosu** - Admin'in oluşturduğu şablonlar
- `id`, `name` (şablon adı), `created_at`

**2. `onboarding_template_items` tablosu** - Şablondaki maddeler
- `id`, `template_id`, `title`, `description`, `item_type` (file/link/text), `is_required`, `sort_order`

**3. `onboarding_checklists` tablosu** - Müşteriye atanan checklist
- `id`, `client_user_id`, `template_id` (nullable), `name`, `status` (pending/in_progress/completed), `created_at`

**4. `onboarding_checklist_items` tablosu** - Müşterinin dolduracağı maddeler
- `id`, `checklist_id`, `title`, `description`, `item_type` (file/link/text), `is_required`, `sort_order`, `is_completed`, `response_text` (metin/link cevabı), `response_file_url` (dosya URL'i), `completed_at`

### Uygulama Değişiklikleri

**Admin tarafı:**
- Yeni sayfa: **Onboarding Şablonları** yönetimi (şablon oluştur, madde ekle/düzenle)
- **ClientDetail** sayfasına "Onboarding" tabı eklenir - şablondan checklist ata veya özel maddeler ekle, müşterinin ilerleme durumunu takip et

**Müşteri tarafı:**
- Yeni sayfa: **Onboarding** - atanmış checklist'i görür, her maddeyi doldurup tamamlar
- Dosya tipi maddeler için dosya yükleme (`kb-files` bucket kullanılır)
- Link tipi için URL input, metin tipi için textarea
- Sidebar'a "Onboarding" menü öğesi eklenir

**RLS Politikaları:**
- Admin tüm tabloları yönetebilir
- Müşteriler sadece kendi checklist ve item'larını görebilir/güncelleyebilir

### Akış
1. Admin bir şablon oluşturur (ör: "Standart Onboarding" - logo, sosyal medya linkleri, marka kılavuzu vs.)
2. Admin müşteri detay sayfasından şablonu atar (isteğe göre madde ekler/çıkarır)
3. Müşteri panelinde "Onboarding" sekmesinde checklist'i görür
4. Her maddeyi dosya yükleyerek, link/metin girerek tamamlar
5. Admin ilerlemeyi müşteri detay sayfasından takip eder

