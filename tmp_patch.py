from pathlib import Path
old='''        result = {\n            'product_id': product_id,\n            'product_url': product_url,\n            'crawled_at': datetime.now().isoformat(),\n            'total_transactions': len(transactions),\n            'transactions': transactions\n        }\n'''
new='''        name_data = driver.execute_script("""
            const getText = (selectors) => {
                for (const sel of selectors) {
                    const el = document.querySelector(sel);
                    if (el && el.textContent) return el.textContent.trim();
                }
                return '';
            };
            const primary = getText(['h1', '.title', '.product_title', '.product-detail .name', '.product_info_area h2']);
            const secondary = getText(['h2', '.sub_title', '.product_info_area h3']);
            const allTexts = Array.from(document.querySelectorAll('p, h1, h2, h3, span'))
              .map(el => el.textContent.trim())
              .filter(Boolean);
            const uniq = Array.from(new Set([primary, secondary, ...allTexts]));
            const hasKorean = (t) => /[가-힣]/.test(t);
            const hasLatin = (t) => /[A-Za-z]/.test(t);
            const korean = uniq.find(hasKorean) || '';
            const english = uniq.find(hasLatin) || '';
            return { korean, english, primary, secondary };
        """)

        name_ko = name_data.get('korean') or name_data.get('primary') or ''
        name_en = name_data.get('english') or name_data.get('secondary') or ''

        result = {
            'product_id': product_id,
            'product_url': product_url,
            'crawled_at': datetime.now().isoformat(),
            'total_transactions': len(transactions),
            'transactions': transactions,
            'name': name_ko or name_en or '',
            'koreanName': name_ko,
            'englishName': name_en
        }\n'''
path=Path('model/crawling/crawl_kream_cdp.py')
src=path.read_text(encoding='utf-8')
if old not in src:
    raise SystemExit('old block not found')
path.write_text(src.replace(old,new), encoding='utf-8')
print('patched')
