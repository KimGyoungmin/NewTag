item_id = '681567'

"""
KREAM 시계열 크롤러 - CDP를 사용하여 API 네트워크 요청 가로채기
Chrome DevTools Protocol을 사용하여 브라우저가 호출하는 API 응답을 직접 캡처합니다
"""

import sys
import time
import json
import re
from datetime import datetime, timedelta
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.utils import ChromeType

# Windows 콘솔 UTF-8 인코딩 설정
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / 'Best_test' / 'Data'
CRAWLED_LOG_PATH = DATA_DIR / 'crawled_product_ids.txt'


def setup_driver_with_cdp(use_persistent_profile=True):
    """CDP를 활성화한 Chrome 드라이버 설정"""
    chrome_options = Options()
    chrome_options.add_argument('--start-maximized')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument('--lang=ko-KR')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)

    # 로컬 크롬 위치 명시 (142.x 설치 기준)
    chrome_binary = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    if chrome_binary.exists():
        chrome_options.binary_location = str(chrome_binary)

    # Selenium 전용 프로필 사용 (쿠키 유지)
    if use_persistent_profile:
        import os
        # 현재 스크립트가 있는 디렉토리에 selenium_profile 폴더 생성
        script_dir = os.path.dirname(os.path.abspath(__file__))
        profile_dir = os.path.join(script_dir, 'selenium_profile')

        # 디렉토리가 없으면 생성
        if not os.path.exists(profile_dir):
            os.makedirs(profile_dir)
            print(f"✓ 새 프로필 디렉토리 생성: {profile_dir}")
        else:
            print(f"✓ 기존 프로필 사용 (쿠키 유지됨): {profile_dir}")

        chrome_options.add_argument(f'--user-data-dir={profile_dir}')
        chrome_options.add_argument('--profile-directory=Default')

    # CDP 로깅 활성화
    chrome_options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})

    # 설치된 크롬(142.x)에 맞춰 드라이버 버전 지정
    service = Service(ChromeDriverManager(chrome_type=ChromeType.GOOGLE, version="142.0.0").install())
    driver = webdriver.Chrome(service=service, options=chrome_options)

    # CDP 네트워크 추적 활성화
    driver.execute_cdp_cmd('Network.enable', {})

    return driver


def naver_login(driver, user_id, user_pw, phone_number=None):
    """네이버 로그인 (핸드폰 인증 포함)"""
    print("\n네이버 로그인 시작...")

    # KREAM 페이지에서 네이버 로그인 버튼 찾기
    try:
        print("  1. KREAM 로그인 페이지로 이동...")
        driver.get('https://kream.co.kr/login')
        time.sleep(2)

        # 네이버 로그인 버튼 찾기
        print("  2. '네이버로 로그인' 버튼 찾기...")
        naver_login_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), '네이버로 로그인') or contains(text(), 'NAVER')]"))
        )
        naver_login_btn.click()
        print("  ✓ 네이버 로그인 버튼 클릭")
        time.sleep(2)

        # 새 창으로 전환될 수 있으므로 모든 창 확인
        if len(driver.window_handles) > 1:
            driver.switch_to.window(driver.window_handles[-1])
            print("  ✓ 네이버 로그인 팝업으로 전환")

        # ID 입력
        print("  3. 아이디 입력 중...")
        id_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, 'id'))
        )
        id_input.clear()
        id_input.send_keys(user_id)
        time.sleep(0.5)

        # PW 입력
        print("  4. 비밀번호 입력 중...")
        pw_input = driver.find_element(By.ID, 'pw')
        pw_input.clear()
        pw_input.send_keys(user_pw)
        time.sleep(0.5)

        # 로그인 버튼 클릭
        print("  5. 로그인 버튼 클릭...")
        login_btn = driver.find_element(By.ID, 'log.login')
        login_btn.click()
        print("  → 로그인 처리 중...")
        time.sleep(3)

        # 로그인 결과 확인
        current_url_after_login = driver.current_url
        print(f"  → 로그인 후 URL: {current_url_after_login}")

        # 핸드폰 인증 처리
        if phone_number:
            print("  6. 핸드폰 인증 확인 중...")
            try:
                # 핸드폰 번호 입력 필드 찾기 (여러 선택자 시도)
                phone_input = None
                phone_selectors = [
                    (By.ID, 'phoneNo'),
                    (By.NAME, 'phoneNo'),
                    (By.XPATH, "//input[@type='tel']"),
                    (By.XPATH, "//input[contains(@placeholder, '전화') or contains(@placeholder, '휴대폰')]")
                ]

                for selector_type, selector_value in phone_selectors:
                    try:
                        phone_input = WebDriverWait(driver, 3).until(
                            EC.presence_of_element_located((selector_type, selector_value))
                        )
                        break
                    except:
                        continue

                if phone_input:
                    print(f"  ✓ 핸드폰 번호 입력 필드 발견!")
                    phone_input.clear()
                    phone_input.send_keys(phone_number)
                    print(f"  ✓ 핸드폰 번호 입력 완료: {phone_number}")
                    time.sleep(1)

                    # 확인 버튼 찾아서 클릭
                    confirm_btn = driver.find_element(By.XPATH, "//button[contains(text(), '확인') or contains(text(), '인증')]")
                    confirm_btn.click()
                    print("  ✓ 확인 버튼 클릭")
                    time.sleep(3)
                else:
                    print("  → 핸드폰 인증 페이지가 나타나지 않음 (스킵)")
            except Exception as e:
                print(f"  → 핸드폰 인증 단계 스킵: {e}")

        # 원래 창으로 돌아가기
        if len(driver.window_handles) > 1:
            driver.switch_to.window(driver.window_handles[0])
            print("  ✓ 메인 창으로 복귀")

        # 로그인 완료 대기 및 확인
        time.sleep(5)

        # 현재 URL 확인
        current_url = driver.current_url
        print(f"  현재 URL: {current_url}")

        # KREAM 홈페이지로 이동했는지 확인
        if 'kream.co.kr' in current_url:
            print("✓ 네이버 로그인 완료! KREAM으로 돌아왔습니다.")
            return True
        else:
            print(f"⚠ 로그인 후 예상치 못한 페이지: {current_url}")
            print("  → KREAM 메인 페이지로 강제 이동")
            driver.get('https://kream.co.kr')
            time.sleep(3)
            return True

    except Exception as e:
        print(f"⚠ 로그인 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


def scroll_drawer_and_wait(driver, wait_time=10):
    """
    Drawer (#panel1) 내에서 스크롤을 계속 내려서 데이터 로딩
    데이터가 더 이상 증가하지 않으면 조기 종료

    Args:
        driver: Selenium WebDriver
        wait_time: 최대 스크롤 대기 시간 (초)
    """
    print(f"  → 최대 {wait_time}초 동안 drawer 스크롤 중...")

    # #panel1 요소 찾기
    try:
        panel = driver.find_element(By.CSS_SELECTOR, '#panel1')
        print("  ✓ #panel1 요소 발견")
    except:
        print("  ⚠ #panel1 요소를 찾을 수 없습니다. 전체 페이지 스크롤 시도...")
        panel = None

    # 스크롤 반복
    scroll_count = 0
    start_time = time.time()

    # 데이터 개수 추적 (조기 종료 조건)
    last_data_count = 0
    no_change_count = 0  # 데이터가 변하지 않은 연속 횟수
    MAX_NO_CHANGE = 6    # 3초 동안(6번 * 0.5초) 변화 없으면 종료

    while time.time() - start_time < wait_time:
        try:
            if panel:
                # #panel1 내부 스크롤
                driver.execute_script("""
                    const panel = document.querySelector('#panel1');
                    if (panel) {
                        // panel 내부의 스크롤 가능한 컨테이너 찾기
                        const scrollContainer = panel.querySelector('.price_body') ||
                                              panel.querySelector('[style*="overflow"]') ||
                                              panel;

                        // 스크롤 다운
                        scrollContainer.scrollTop = scrollContainer.scrollTop + 500;

                        // 또는 마지막 요소로 스크롤
                        const lastChild = scrollContainer.lastElementChild;
                        if (lastChild) {
                            lastChild.scrollIntoView({behavior: 'smooth', block: 'end'});
                        }

                        return scrollContainer.scrollTop;
                    }
                    return 0;
                """)
                scroll_count += 1
            else:
                # 전체 페이지 스크롤
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                scroll_count += 1

            # 현재 데이터 개수 확인 (조기 종료 체크)
            current_data_count = driver.execute_script("""
                const panel = document.querySelector('#panel1');
                if (panel) {
                    return panel.querySelectorAll('div.list_txt').length;
                }
                return 0;
            """)

            # 데이터 변화 확인
            if current_data_count == last_data_count:
                no_change_count += 1
            else:
                no_change_count = 0  # 데이터가 증가하면 카운터 리셋
                last_data_count = current_data_count

            # 조기 종료 조건: 데이터가 더 이상 증가하지 않음
            if no_change_count >= MAX_NO_CHANGE:
                elapsed = int(time.time() - start_time)
                print(f"    [{elapsed}/{wait_time}초] 데이터 로딩 완료 감지 (div.list_txt: {current_data_count}개)")
                print(f"  ✓ 스크롤 조기 종료: 총 {scroll_count}회 (더 이상 새 데이터 없음)")
                time.sleep(1)  # 마지막 렌더링 대기
                return

            # 진행 상황 출력 (2초마다)
            if scroll_count % 4 == 0:
                elapsed = int(time.time() - start_time)
                print(f"    [{elapsed}/{wait_time}초] 스크롤 {scroll_count}회 | 데이터: {current_data_count}개")

            time.sleep(0.5)  # 0.5초 대기

        except Exception as e:
            print(f"  ⚠ 스크롤 에러: {e}")
            break

    print(f"  ✓ 스크롤 완료: 총 {scroll_count}회 (최대 시간 도달)")
    time.sleep(2)  # 마지막 API 호출 대기


def extract_dom_transactions(driver, wait_time=60):
    """
    DOM에서 직접 거래 데이터 추출 (div.list_txt에서 사이즈, 가격, 시간 파싱)

    Args:
        driver: Selenium WebDriver
        wait_time: 데이터 수집 대기 시간 (초)

    Returns:
        list: 모든 거래 데이터
    """
    print(f"\n{wait_time}초 동안 DOM에서 거래 데이터를 수집합니다...")

    all_transactions = []
    seen_transactions = set()

    start_time = time.time()
    last_count = 0

    while time.time() - start_time < wait_time:
        elapsed = int(time.time() - start_time)

        # 진행 상황 출력 (5초마다)
        if elapsed % 5 == 0 and elapsed > 0:
            print(f"  [{elapsed}/{wait_time}초] 수집된 거래: {len(all_transactions)}건")

        # DOM에서 거래 내역 추출
        transactions_data = driver.execute_script("""
            const transactions = [];
            const debug = {
                listTxtCount: 0,
                allDivClasses: [],
                sampleHTML: '',
                containerFound: ''
            };

            // 모든 panel과 탭 정보 수집 (디버깅)
            const allPanelsInfo = [];
            const panels = document.querySelectorAll('[role="tabpanel"]');
            panels.forEach(panel => {
                const labelId = panel.getAttribute('aria-labelledby');
                let labelText = '';
                if (labelId) {
                    const label = document.getElementById(labelId);
                    labelText = label ? label.textContent.trim() : '';
                }
                allPanelsInfo.push({
                    id: panel.id,
                    ariaLabelledby: labelId,
                    labelText: labelText,
                    hasListTxt: panel.querySelectorAll('div.list_txt').length
                });
            });
            debug.allPanelsInfo = allPanelsInfo;

            // 채결 거래 영역만 선택
            let container = null;

            // 방법 1: panel1 직접 선택 (가장 많은 데이터가 있는 panel 시도)
            container = document.querySelector('#panel1');
            if (container && container.querySelectorAll('div.list_txt').length > 0) {
                debug.containerFound = '#panel1 (채결 거래 추정 - 최대 데이터)';
            } else {
                container = null;
            }

            // 방법 2: aria-labelledby로 채결 거래 panel 찾기
            if (!container) {
                for (const panel of panels) {
                    const labelId = panel.getAttribute('aria-labelledby');
                    if (labelId) {
                        const label = document.getElementById(labelId);
                        if (label && (label.textContent.includes('채결') || label.textContent.includes('체결'))) {
                            container = panel;
                            debug.containerFound = `채결 거래 panel: ${panel.id}`;
                            break;
                        }
                    }
                }
            }

            // 방법 3: #panel1 사용 (fallback)
            if (!container) {
                container = document.querySelector('#panel1');
                debug.containerFound = '#panel1 (fallback)';
            }

            let listItems = [];
            if (container) {
                listItems = container.querySelectorAll('div.list_txt');
            } else {
                listItems = document.querySelectorAll('div.list_txt');
            }
            debug.listTxtCount = listItems.length;

            // div.list_txt가 없으면 다른 선택자 시도
            if (listItems.length === 0) {
                // 채결 거래 영역에서 모든 div 찾기
                const container = document.querySelector('#panel1') ||
                                  document.querySelector('.price_body') ||
                                  document.querySelector('.product-trade-history-drawer__content');

                if (container) {
                    // 컨테이너의 HTML 샘플 저장
                    debug.sampleHTML = container.innerHTML.substring(0, 500);

                    // 모든 div의 클래스명 수집
                    const allDivs = container.querySelectorAll('div');
                    const classSet = new Set();
                    allDivs.forEach(div => {
                        if (div.className) {
                            classSet.add(div.className);
                        }
                    });
                    debug.allDivClasses = Array.from(classSet).slice(0, 20);

                    // 대체 선택자: span이 3개 있는 모든 div 찾기
                    allDivs.forEach(div => {
                        const spans = div.querySelectorAll('span');
                        if (spans.length === 3) {
                            const text0 = spans[0].textContent.trim();
                            const text1 = spans[1].textContent.trim();
                            const text2 = spans[2].textContent.trim();

                            // 가격처럼 보이면 (숫자와 쉼표 포함)
                            if (text1.match(/[0-9,]+/) && text1.length > 3) {
                                transactions.push({
                                    id: text1 + '_' + text2,
                                    size: text0,
                                    price: text1,
                                    time: text2,
                                    rawTime: text2
                                });
                            }
                        }
                    });
                }
            } else {
                // div.list_txt가 있으면 구조 분석
                // 첫 5개 샘플 저장
                const samples = [];
                for (let i = 0; i < Math.min(5, listItems.length); i++) {
                    const item = listItems[i];
                    const spans = item.querySelectorAll('span');
                    samples.push({
                        spanCount: spans.length,
                        innerHTML: item.innerHTML.substring(0, 150),
                        texts: Array.from(spans).map(s => s.textContent.trim()).slice(0, 5)
                    });
                }
                debug.samples = samples;

                // 실제 데이터 추출: 3개씩 묶어서 읽기 (사이즈, 가격, 시간/수량)
                for (let i = 0; i < listItems.length - 2; i += 3) {
                    const sizeDiv = listItems[i];
                    const priceDiv = listItems[i + 1];
                    const thirdDiv = listItems[i + 2];  // 시간 또는 수량

                    const sizeSpan = sizeDiv.querySelector('span');
                    const priceSpan = priceDiv.querySelector('span');
                    const thirdSpans = thirdDiv.querySelectorAll('span');

                    if (sizeSpan && priceSpan && thirdSpans.length > 0) {
                        const size = sizeSpan.textContent.trim();
                        const price = priceSpan.textContent.trim();
                        // 마지막 span (빠른배송 아이콘 무시)
                        const thirdText = thirdSpans[thirdSpans.length - 1].textContent.trim();

                        // 채결 거래인지 확인: 시간 텍스트에는 "전", "분", "시간", "일" 등이 포함됨
                        // 판매/구매 입찰: 숫자만 있음 (수량)
                        const isTransaction = thirdText.includes('전') ||
                                             thirdText.includes('분') ||
                                             thirdText.includes('시간') ||
                                             thirdText.includes('일') ||
                                             thirdText.includes('-') ||  // 날짜 형식 (2025-10-01)
                                             thirdText.includes('/');    // 날짜 형식 (10/01)

                        // 채결 거래만 수집
                        if (isTransaction && price.match(/[0-9]/)) {
                            transactions.push({
                                id: price + '_' + thirdText,
                                size: size,
                                price: price,
                                time: thirdText,
                                rawTime: thirdText
                            });
                        }
                    }
                }
            }

            return { transactions, debug };
        """)

        # 디버그 정보 출력 (첫 번째 실행에만)
        if elapsed == 1:
            debug_info = transactions_data.get('debug', {})

            # 모든 panel 정보 출력
            if debug_info.get('allPanelsInfo'):
                print(f"  [DEBUG] 발견된 모든 panels:")
                for panel_info in debug_info.get('allPanelsInfo', []):
                    print(f"    - ID: {panel_info['id']}, Label: '{panel_info['labelText']}', div.list_txt 개수: {panel_info['hasListTxt']}")

            print(f"  [DEBUG] 선택된 컨테이너: {debug_info.get('containerFound', 'None')}")
            print(f"  [DEBUG] div.list_txt 개수: {debug_info.get('listTxtCount', 0)}")

            if debug_info.get('samples'):
                print(f"  [DEBUG] div.list_txt 샘플 구조:")
                for i, sample in enumerate(debug_info.get('samples', [])[:3]):
                    print(f"    샘플 #{i+1}: span 개수={sample.get('spanCount')}")
                    print(f"             텍스트={sample.get('texts')}")

        # 거래 데이터 추출
        transaction_list = transactions_data.get('transactions', []) if isinstance(transactions_data, dict) else transactions_data

        # 새로운 거래만 추가
        for tx in transaction_list:
            if tx['id'] not in seen_transactions:
                seen_transactions.add(tx['id'])

                # 가격 파싱 (쉼표 제거 후 숫자로 변환)
                price_str = tx['price'].replace(',', '').replace('원', '').strip()
                try:
                    price = float(price_str)
                except:
                    price = None

                raw_time = tx['rawTime']
                normalized_date = normalize_time_text(raw_time)

                all_transactions.append({
                    'id': tx['id'],
                    'price': price,
                    'date': normalized_date,  # "3시간 전" 등은 오늘 날짜로 변환
                    'raw_date_text': raw_time,
                    'size': tx['size'],
                    'transaction_type': 'sale'
                })

        # 데이터가 증가하지 않으면 대기
        if len(all_transactions) == last_count:
            time.sleep(1)
        else:
            last_count = len(all_transactions)
            time.sleep(0.5)

    print(f"\n✓ 수집 완료: 총 {len(all_transactions)}건의 거래 데이터")
    return all_transactions


def normalize_time_text(raw_time: str) -> str:
    """
    상대 시간을 오늘 날짜 등으로 변환.
    - '24분 전', '6시간 전', '방금 전' 등은 오늘 날짜로 변환 (YY/MM/DD)
    - 'N일 전'은 N일 전 날짜로 변환
    - 그 외에는 원본 텍스트 반환
    """
    if not raw_time:
        return raw_time

    text = str(raw_time).strip()
    today = datetime.now().strftime("%y/%m/%d")

    # 방금/분/시간 전 → 오늘
    if ('분 전' in text) or ('시간 전' in text) or text == '방금 전':
        return today

    # N일 전 → 날짜 계산
    match_day = re.match(r'(\d+)\s*일\s*전', text)
    if match_day:
        days_ago = int(match_day.group(1))
        target_date = (datetime.now() - timedelta(days=days_ago)).strftime("%y/%m/%d")
        return target_date

    return text


def extract_api_responses(driver, product_id, wait_time=60):
    """
    브라우저 로그에서 API 응답 추출

    Args:
        driver: Selenium WebDriver
        product_id: 크림 상품 ID
        wait_time: API 호출 대기 시간 (초)

    Returns:
        list: 모든 거래 데이터
    """
    print(f"\n{wait_time}초 동안 API 응답을 수집합니다...")
    print("  디버깅: 모든 API 호출을 모니터링합니다...")

    all_transactions = []
    seen_transactions = set()
    processed_requests = set()  # 이미 처리한 request_id 추적

    start_time = time.time()
    check_interval = 1  # 1초마다 로그 체크 (더 자주)
    api_found_count = 0

    while time.time() - start_time < wait_time:
        elapsed = int(time.time() - start_time)

        # 진행 상황 출력 (5초마다)
        if elapsed % 5 == 0 and elapsed > 0:
            print(f"  [{elapsed}/{wait_time}초] 수집된 거래: {len(all_transactions)}건 | API 감지: {api_found_count}회")

        # 브라우저 로그에서 네트워크 요청 추출
        try:
            logs = driver.get_log('performance')
        except:
            # 로그 가져오기 실패시 계속
            time.sleep(check_interval)
            continue

        for log in logs:
            try:
                message = json.loads(log['message'])
                log_method = message.get('message', {}).get('method', '')
                message_params = message.get('message', {}).get('params', {})

                # Network.responseReceived 이벤트 필터링
                if log_method == 'Network.responseReceived':
                    response = message_params.get('response', {})
                    url = response.get('url', '')
                    request_id = message_params.get('requestId')

                    # 디버깅: 모든 kream API 호출 출력
                    if 'api.kream.co.kr' in url:
                        print(f"  [DEBUG] KREAM API: {url}")

                    # KREAM API 거래 내역 URL 확인 - sales만 수집 (실제 거래 내역)
                    if request_id and request_id not in processed_requests:
                        if 'api.kream.co.kr' in url and f'/products/{product_id}/sales' in url:
                            api_found_count += 1
                            processed_requests.add(request_id)
                            print(f"  ✓ API 호출 감지 #{api_found_count}: {url}")

                            # 응답 데이터 가져오기
                            try:
                                # 약간의 대기 (응답이 완전히 로드되도록)
                                time.sleep(0.5)

                                response_body = driver.execute_cdp_cmd(
                                    'Network.getResponseBody',
                                    {'requestId': request_id}
                                )

                                if 'body' in response_body:
                                    data = json.loads(response_body['body'])

                                    # 거래 데이터 추출 - 'items' 필드 사용
                                    items = data.get('items', [])
                                    sales = data.get('sales', [])  # 구버전 호환

                                    # items 또는 sales 중 하나라도 있으면 처리
                                    transaction_data = items if items else sales

                                    if transaction_data:
                                        print(f"    → 응답에서 {len(transaction_data)}건의 거래 데이터 발견")

                                        # 디버깅: 첫 번째 item 출력 (한 번만)
                                        if len(all_transactions) == 0 and len(transaction_data) > 0:
                                            first_item = transaction_data[0]
                                            print(f"    [DEBUG] 첫 item 키: {list(first_item.keys())}")
                                            print(f"    [DEBUG] 첫 item 값 샘플: {json.dumps(first_item, ensure_ascii=False)[:200]}")

                                        for item in transaction_data:
                                            # id 필드 찾기 (여러 형태 지원)
                                            item_id = (item.get('id') or
                                                      item.get('sale_id') or
                                                      item.get('bid_id') or
                                                      item.get('ask_id') or
                                                      str(item.get('price', '')) + '_' + str(item.get('date_created', ''))[:10])

                                            # 중복 제거
                                            if item_id and item_id not in seen_transactions:
                                                seen_transactions.add(item_id)

                                                all_transactions.append({
                                                    'id': item_id,
                                                    'price': item.get('price') or item.get('product_price'),
                                                    'date': item.get('date_created') or item.get('created_at'),
                                                    'size': item.get('product_option_name', '') or item.get('size', '') or item.get('option_name', ''),
                                                    'transaction_type': item.get('transaction_type', 'sale')
                                                })

                                        print(f"    → {len(transaction_data)}건 처리 완료 (총 {len(all_transactions)}건 수집)")
                                    else:
                                        print(f"    → 응답에 'items' 또는 'sales' 데이터 없음")
                                        print(f"    → 응답 구조: {list(data.keys())[:10]}")

                            except Exception as e:
                                print(f"    ⚠ 응답 body 가져오기 실패: {type(e).__name__}: {e}")

            except Exception as e:
                # JSON 파싱 에러 등 무시
                pass

        time.sleep(check_interval)

    print(f"\n✓ 수집 완료: 총 {len(all_transactions)}건의 거래 데이터 (API 호출: {api_found_count}회)")
    return all_transactions


def crawl_kream_with_cdp(product_url, naver_id=None, naver_pw=None, phone_number=None, wait_time=60):
    """
    CDP를 사용하여 KREAM 제품 거래 내역 크롤링

    Args:
        product_url: KREAM 제품 URL (예: https://kream.co.kr/products/179981)
        naver_id: 네이버 아이디 (선택)
        naver_pw: 네이버 비밀번호 (선택)
        phone_number: 핸드폰 번호 (선택, 인증시 필요)
        wait_time: 데이터 수집 대기 시간 (초)

    Returns:
        dict: 거래 데이터
    """

    # URL에서 상품 ID 추출
    match = re.search(r'/products/(\d+)', product_url)
    if not match:
        raise ValueError("올바른 KREAM 상품 URL이 아닙니다")

    product_id = match.group(1)
    print(f"상품 ID: {product_id}")

    driver = setup_driver_with_cdp(use_persistent_profile=True)  # 프로필 사용으로 쿠키 유지

    try:
        # KREAM 제품 페이지 접속
        print(f"\nKREAM 제품 페이지 접속: {product_url}")
        driver.get(product_url)
        time.sleep(3)

        # "거래 입찰 내역 더보기" 버튼 찾기 및 클릭
        print("\n'거래 입찰 내역 더보기' 버튼 찾는 중...")
        detail_button_found = False

        # 먼저 페이지를 약간 스크롤 (버튼이 보이게)
        driver.execute_script("window.scrollTo(0, 300);")
        time.sleep(1)

        # JavaScript로 버튼 찾기
        button_element = driver.execute_script("""
            const elements = Array.from(document.querySelectorAll('p, button, a, div, span'));
            const button = elements.find(el => {
                const text = el.textContent.trim();
                return text === '거래 입찰 내역 더보기' && el.offsetParent !== null;
            });

            if (button) {
                button.scrollIntoView({behavior: 'smooth', block: 'center'});
            }

            return button;
        """)

        time.sleep(1)

        if button_element:
            print("✓ '거래 입찰 내역 더보기' 버튼 발견! 클릭 시도...")
            driver.execute_script("arguments[0].click();", button_element)
            print("✓ '거래 입찰 내역 더보기' 버튼 클릭 완료")
            detail_button_found = True
            time.sleep(3)

            # 클릭 후 현재 URL 확인
            current_url = driver.current_url
            print(f"  → 클릭 후 URL: {current_url}")

            # 로그인 페이지로 리다이렉트 되었는지 확인
            if 'login' in current_url.lower() or 'nid.naver.com' in current_url:
                print("  → 로그인 페이지로 이동됨! 네이버 로그인 진행...")

                # 네이버 로그인 수행
                if naver_id and naver_pw:
                    # KREAM 로그인 페이지에서 네이버 로그인 버튼 찾기
                    try:
                        print("  1. 로그인 페이지 로딩 대기...")
                        time.sleep(2)

                        print("  2. '네이버로 로그인' 버튼 찾기...")
                        # 정확한 CSS 선택자 사용
                        naver_login_btn = WebDriverWait(driver, 10).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, '.btn.full.outline.btn_login_naver'))
                        )
                        naver_login_btn.click()
                        print("  ✓ 네이버 로그인 버튼 클릭")
                        time.sleep(3)

                        # 새 창으로 전환될 수 있음
                        if len(driver.window_handles) > 1:
                            driver.switch_to.window(driver.window_handles[-1])
                            print("  ✓ 네이버 로그인 팝업으로 전환")

                        # ID 입력
                        print("  2. 아이디 입력 중...")
                        id_input = WebDriverWait(driver, 10).until(
                            EC.presence_of_element_located((By.ID, 'id'))
                        )
                        id_input.clear()
                        id_input.send_keys(naver_id)
                        time.sleep(0.5)

                        # PW 입력
                        print("  3. 비밀번호 입력 중...")
                        pw_input = driver.find_element(By.ID, 'pw')
                        pw_input.clear()
                        pw_input.send_keys(naver_pw)
                        time.sleep(0.5)

                        # 로그인 버튼 클릭
                        print("  4. 로그인 버튼 클릭...")
                        login_btn = driver.find_element(By.ID, 'log.login')
                        login_btn.click()
                        print("  → 로그인 처리 중...")
                        time.sleep(3)

                        # 로그인 후 URL 변화 감지 (최대 15초 대기)
                        print("  → 로그인 완료 및 리다이렉트 대기 중...")
                        for i in range(15):
                            time.sleep(1)
                            current_url_check = driver.current_url
                            if 'kream.co.kr' in current_url_check:
                                print(f"  ✓ KREAM으로 리다이렉트 완료! ({i+1}초 경과)")
                                break
                            if i % 3 == 0:
                                print(f"    → {i+1}초 경과... 현재 URL: {current_url_check[:50]}...")

                        # 핸드폰 인증 처리
                        if phone_number:
                            print("  5. 핸드폰 인증 확인 중...")
                            try:
                                phone_input = None
                                phone_selectors = [
                                    (By.ID, 'phoneNo'),
                                    (By.NAME, 'phoneNo'),
                                    (By.XPATH, "//input[@type='tel']")
                                ]

                                for selector_type, selector_value in phone_selectors:
                                    try:
                                        phone_input = WebDriverWait(driver, 3).until(
                                            EC.presence_of_element_located((selector_type, selector_value))
                                        )
                                        break
                                    except:
                                        continue

                                if phone_input:
                                    print(f"  ✓ 핸드폰 번호 입력 필드 발견!")
                                    phone_input.clear()
                                    phone_input.send_keys(phone_number)
                                    print(f"  ✓ 핸드폰 번호 입력 완료: {phone_number}")
                                    time.sleep(1)

                                    # "다음" 또는 "확인" 버튼 찾기
                                    next_btn_selectors = [
                                        "//button[contains(text(), '다음')]",
                                        "//button[contains(text(), '확인')]",
                                        "//button[contains(text(), '인증')]",
                                        "//a[contains(text(), '다음')]"
                                    ]

                                    button_clicked = False
                                    for selector in next_btn_selectors:
                                        try:
                                            next_btn = driver.find_element(By.XPATH, selector)
                                            next_btn.click()
                                            print(f"  ✓ '다음' 버튼 클릭 (선택자: {selector})")
                                            button_clicked = True
                                            time.sleep(3)
                                            break
                                        except:
                                            continue

                                    if not button_clicked:
                                        print("  ⚠ '다음' 버튼을 찾지 못했습니다.")
                            except Exception as e:
                                print(f"  → 핸드폰 인증 스킵: {e}")

                        # 원래 창으로 돌아가기
                        if len(driver.window_handles) > 1:
                            driver.switch_to.window(driver.window_handles[0])

                        print("  ✓ 로그인 완료!")
                        time.sleep(5)

                        # 현재 URL 확인
                        current_url_after_login = driver.current_url
                        print(f"  → 로그인 후 URL: {current_url_after_login}")

                        # 제품 페이지로 돌아갔는지 확인
                        if product_id not in current_url_after_login:
                            print(f"  → 제품 페이지로 다시 이동: {product_url}")
                            driver.get(product_url)
                            time.sleep(3)

                    except Exception as e:
                        print(f"  ⚠ 로그인 실패: {e}")
                        import traceback
                        traceback.print_exc()
                else:
                    print("  ⚠ 로그인 정보가 없습니다. 로그인을 건너뜁니다.")
                    return {'product_id': product_id, 'product_url': product_url, 'total_transactions': 0, 'transactions': []}

            # drawer 확인 및 재시도
            print("\n  → Drawer 확인 중...")
            time.sleep(2)

            # drawer가 이미 열려있는지 확인
            drawer_visible = driver.execute_script("""
                const drawer = document.querySelector('.product-trade-history-drawer__content');
                return drawer && drawer.offsetParent !== null;
            """)

            if not drawer_visible:
                print("  → Drawer가 보이지 않음. '거래 입찰 내역 더보기' 버튼 다시 클릭...")

                # "거래 입찰 내역 더보기" 버튼을 다시 찾아서 클릭
                button_element = driver.execute_script("""
                    const elements = Array.from(document.querySelectorAll('p, button, a, div, span'));
                    const button = elements.find(el => {
                        const text = el.textContent.trim();
                        return text === '거래 입찰 내역 더보기' && el.offsetParent !== null;
                    });
                    return button;
                """)

                if button_element:
                    driver.execute_script("arguments[0].click();", button_element)
                    print("  ✓ '거래 입찰 내역 더보기' 버튼 다시 클릭 완료")
                    time.sleep(5)
                else:
                    print("  ⚠ '거래 입찰 내역 더보기' 버튼을 다시 찾을 수 없습니다")
            else:
                print("  ✓ Drawer가 이미 열려 있습니다!")

        # 사이즈 필터링 (270 사이즈 선택)
        print("\n사이즈 필터 설정 중...")
        # 사이즈 필터링 비활성화 (모든 사이즈 데이터 수집)

        # Drawer 내에서 스크롤하면서 DOM 데이터 수집
        print("\nDrawer 스크롤 시작...")
        scroll_drawer_and_wait(driver, wait_time=20)  # 100초 스크롤

        # DOM에서 거래 데이터 추출
        print("\nDOM에서 거래 데이터 추출 중...")
        transactions = extract_dom_transactions(driver, wait_time=5)  # DOM 수집은 5초면 충분

        # 결과 정리
        name_data = driver.execute_script("""
            const getText = (selectors) => {
                for (const sel of selectors) {
                    const el = document.querySelector(sel);
                    if (el && el.textContent) return el.textContent.trim();
                }
                return '';
            };
            // Trade/?? ??? ?? ??
            const drawerKo = getText([
                '.product-trade-history-drawer__header_product_info_name',
                '[class*=\"product-trade-history-drawer__header_product_info_name\"]',
                '#desktop-tablet-target-v-0-0-0 > div > div.product-trade-history-drawer__header_product_info > div.product-trade-history-drawer__header_product_info_content > div > div.product-trade-history-drawer__header_product_info_name'
            ]);
            const drawerDesc = Array.from(document.querySelectorAll(
                '.product-trade-history-drawer__header_product_info_description p, [class*=\"product-trade-history-drawer__header_product_info_description\"] p'
            ))
              .map(el => el.textContent.trim()).filter(Boolean);
            const drawerEn = drawerDesc.find(t => /[A-Za-z]/.test(t)) || '';

            // ?? ?? ??
            const primary = getText([
                '#wrap .product-detail-left-section p',
                '#wrap > div.layout__main--without-search > div > div > div.product-detail-left-section > div:nth-child(4) > div > div.layout_list_vertical.pc\\:cgap-2.mo\\:cgap-2.list-vertical-fill-available > div:nth-child(4) > div.layout_list_horizontal.sdui-fit-content > div > div > div:nth-child(1) > p',
                '.text-lookup',
                'p.text-lookup',
                'p.text-lookup.display_paragraph',
                'p.text-lookup.text-element',
                'p[class*=text-lookup]',
                'h1',
                '.title',
                '.product_title',
                '.product-detail .name',
                '.product_info_area h2'
            ]);
            const secondary = getText(['h2', '.sub_title', '.product_info_area h3']);
            const ogTitle = (() => {
                const el = document.querySelector('meta[property=\"og:title\"]');
                return el && el.content ? el.content.trim() : '';
            })();

            const uniq = Array.from(new Set([drawerKo, drawerEn, primary, secondary, ogTitle]));
            const hasKorean = (t) => /[\uac00-\ud7a3]/.test(t);
            const hasLatin = (t) => /[A-Za-z]/.test(t);

            const clean = (t) => {
                if (!t) return '';
                let cleaned = t;
                const keywords = [
                    \"\ucd5c\uadfc \uc2e4\uc138\", // ?? ??
                    \"\uac70\ub798\",               // ??
                    \"\uc785\ucc29\",               // ??
                    \"\uc635\uc158\",               // ??
                    \"\uc635\uc158\uad6c\ub9e4\", // ????
                    \"\ube60\ub978\ubc30\uc1a1\", // ????
                    \"\uac70\ub798\uc774\ub825\", // ????
                    \"\uc785\ucc29\uc774\ub825\"  // ????
                ];
                for (const kw of keywords) {
                    const idx = cleaned.indexOf(kw);
                    if (idx >= 0) cleaned = cleaned.slice(0, idx);
                }
                cleaned = cleaned.split(/\\r?\\n/)[0].trim();
                if (cleaned.length > 120) cleaned = cleaned.slice(0, 120);
                return cleaned;
            };

            const valid = uniq.filter(Boolean).map(t => clean(t)).filter(t => t.length > 0);
            const koreanCandidates = valid.filter(hasKorean).sort((a, b) => b.length - a.length);
            const englishCandidates = valid.filter(hasLatin).sort((a, b) => b.length - a.length);
            const korean = koreanCandidates[0] || '';
            const english = englishCandidates[0] || '';
            return { korean, english, primary, secondary, ogTitle, drawerKo, drawerEn };
        """)

        name_ko = name_data.get('korean') or name_data.get('primary') or ''
        name_en = name_data.get('english') or name_data.get('secondary') or ''
        # Drop generic placeholders like '상품'
        generic_terms = ["\uc0c1\ud488", "\uac80\uc218 \ud2b9\uc774\uc0ac\ud56d", "\ube0c\ub79c\ub4dc \ud2b9\uc774\uc0ac\ud56d"]
        if any(term in name_ko for term in generic_terms):
            name_ko = ''
        if any(term in name_en for term in generic_terms):
            name_en = ''

        result = {
            'product_id': product_id,
            'product_url': product_url,
            'crawled_at': datetime.now().isoformat(),
            'total_transactions': len(transactions),
            'transactions': transactions,
            'name': name_ko or name_en or '',
            'koreanName': name_ko,
            'englishName': name_en
        }

        return result

    finally:
        print("\n브라우저를 종료합니다...")
        driver.quit()


def save_to_json(data, filename=None):
    """
    결과를 JSON 파일로 저장

    Args:
        data: 저장할 데이터
        filename: 파일명 (None이면 product_id 기반으로 자동 생성)
    """
    if filename is None:
        # product_id 기반으로 파일명 생성
        product_id = data.get('product_id', 'unknown')
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'kream_{product_id}_{timestamp}.json'

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✓ 결과 저장 완료: {filename}")


def load_product_ids_from_data_dir(data_dir: Path):
    """Data 디렉토리의 JSON에서 product_id 추출"""
    product_ids = {}
    for json_path in sorted(data_dir.glob('*.json')):
        try:
            with open(json_path, encoding='utf-8') as f:
                data = json.load(f)
            pid = str(data.get('product_id') or '').strip()
            if pid:
                product_ids[pid] = json_path.name
        except Exception as e:
            print(f"⚠ {json_path.name} 읽기 실패: {e}")
    return product_ids


def load_processed_ids(log_path: Path):
    if not log_path.exists():
        return set()
    try:
        with open(log_path, encoding='utf-8') as f:
            return set(line.strip() for line in f if line.strip())
    except Exception as e:
        print(f"⚠ 처리 기록을 읽는 중 오류: {e}")
        return set()


def save_processed_ids(log_path: Path, processed_ids):
    with open(log_path, 'w', encoding='utf-8') as f:
        for pid in sorted(processed_ids):
            f.write(f"{pid}\n")



if __name__ == '__main__':
    # 설정
    args = sys.argv[1:]

    # 네이버 로그인 정보
    NAVER_ID = 'monthly82000'
    NAVER_PW = 'dd13579'
    PHONE_NUMBER = '01037269034'

    # 데이터 수집 대기 시간 (초)
    WAIT_TIME = 30

    # 신규 데이터(파일) 기반 배치 크롤링
    auto_from_data = '--auto-from-data' in args
    data_dir_override = None
    for arg in args:
        if arg.startswith('--data-dir='):
            data_dir_override = Path(arg.split('=', 1)[1]).expanduser().resolve()

    if auto_from_data:
        target_data_dir = data_dir_override or DATA_DIR
        target_data_dir.mkdir(parents=True, exist_ok=True)
        log_path = target_data_dir / CRAWLED_LOG_PATH.name

        print(f"데이터 디렉토리: {target_data_dir}")
        product_ids = load_product_ids_from_data_dir(target_data_dir)
        processed_ids = load_processed_ids(log_path)
        new_ids = [pid for pid in product_ids if pid not in processed_ids]

        if not new_ids:
            print("신규 product_id가 없습니다. 종료합니다.")
            sys.exit(0)

        print(f"신규 product_id: {new_ids}")

        for pid in new_ids:
            PRODUCT_URL = f'https://kream.co.kr/products/{pid}'
            print(f"\n=== {pid} 크롤링 시작 ===")
            result = crawl_kream_with_cdp(
                product_url=PRODUCT_URL,
                naver_id=NAVER_ID,
                naver_pw=NAVER_PW,
                phone_number=PHONE_NUMBER,
                wait_time=WAIT_TIME
            )

            output_path = target_data_dir / f'kream_{pid}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            save_to_json(result, filename=str(output_path))
            processed_ids.add(pid)
            save_processed_ids(log_path, processed_ids)

        print("\n✓ 배치 크롤링 완료")
        sys.exit(0)

    cli_arg = next((a for a in args if not a.startswith('--')), None)
    if cli_arg and cli_arg.startswith('http'):
        PRODUCT_URL = cli_arg.rstrip('/')
    else:
        if cli_arg:
            item_id = cli_arg
        PRODUCT_URL = f'https://kream.co.kr/products/{item_id}'  # 여기에 실제 상품 ID 입력


    try:
        print("=" * 60)
        print("KREAM 시계열 크롤러 (CDP 방식)")
        print("=" * 60)

        result = crawl_kream_with_cdp(
            product_url=PRODUCT_URL,
            naver_id=NAVER_ID,
            naver_pw=NAVER_PW,
            phone_number=PHONE_NUMBER,
            wait_time=WAIT_TIME
        )

        print("\n" + "=" * 60)
        print("수집 결과")
        print("=" * 60)
        print(f"상품 ID: {result['product_id']}")
        print(f"총 거래 건수: {result['total_transactions']}")

        if result['transactions']:
            print("\n최근 거래 10건:")
            for i, tx in enumerate(result['transactions'][:10], 1):
                price = f"{tx['price']:,}원" if tx['price'] else "가격 없음"
                date = tx['date'] or '날짜 없음'
                size = tx['size'] or '사이즈 없음'
                print(f"  {i}. {date} | {price} | {size}")

        # JSON 저장
        save_to_json(result)

        print("\n✓ 크롤링 완료!")

    except KeyboardInterrupt:
        print("\n\n⚠ 사용자가 중단했습니다.")
    except Exception as e:
        print(f"\n⚠ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
