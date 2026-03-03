        const INITIAL_CONTENT = {
            res_error: { title: "기타 프로그램 오류 대응", icon: "alert-circle", type: "success", list: ["정확한 오류 메시지나 팝업 내용 확인\n어떤 화면에서 어떤 문구가 발생하는지 확인하세요.", "프로그램 강제 종료(Alt+F4) 및 재실행 안내\n재실행 후에도 동일한지 확인이 필요합니다.", "해결 안 될 시 원격 지원 도구 실행\n애니데스크(AnyDesk) 번호를 확인받으세요.", "로그인 오류 시 계정 정보 재확인\n비밀번호 대소문자 구분을 확인하세요."] },
            res_err_run: { title: "프로그램 실행/로딩 오류", icon: "power", type: "success", list: ["PC/포스기 재부팅 후 재실행 안내\n일시적인 메모리 부족일 수 있습니다.", "백신 프로그램 오작동 확인\n실시간 감지를 잠시 끄고 실행해보세요.", "관리자 권한으로 실행\n우클릭 > 관리자 권한으로 실행해보세요."] },
            res_err_pay: { title: "결제 중 통신/프로그램 오류", icon: "credit-card", type: "success", list: ["PG/밴사 통신 상태 확인\n인터넷 연결이 불안정할 때 발생할 수 있습니다.", "결제 모듈 업데이트 확인\n카드가 정상 결제됐는지 반드시 영수증을 확인하세요.", "임시로 현금 결제 유도 후 재접속\n고객 주문 처리가 시급할 때 안내하세요."] },
            res_hardware: { title: "장비/하드웨어 대응 (공통)", icon: "hard-drive", type: "success", list: ["전원 플러그 및 USB 케이블 연결 상태 확인\n간혹 발에 채여 빠지는 경우가 많습니다.", "프린터: 용지 잔량 및 걸림 확인\n빨간불이 들어와 있는지 확인하세요.", "카드리더기: IC칩 방향 확인 및 단말기 재부팅\n'MS 읽기' 문구가 뜨면 IC칩 방향이 반대인 것입니다.", "포스기 본체: 전원 버튼 조작 안내\n모니터 우측 하단이나 후면 전원 버튼을 확인하세요."] },
            res_hw_pos: { title: "포스기 / 키오스크 대응", icon: "monitor", type: "success", list: ["포스기 본체 전원 확인\n어댑터 연결 및 전원 버튼 상태를 확인하세요.", "터치 불량 시 윈도우 보정\n제어판에서 터치 보정을 진행하세요.", "네트워크 연결 확인\n랜선(LAN)이 제대로 꽂혀 있는지 핑 테스트를 진행하세요."] },
            res_hw_printer: { title: "프린터 (영수증/주방) 대응", icon: "printer", type: "success", list: ["프린터 에러등 확인\n용지가 끼었거나 덮개가 제대로 닫히지 않았는지 확인하세요.", "연결 케이블 재장착\n프린터 뒷면의 케이블을 뺐다가 다시 꽉 꽂아보세요."] },
            res_hw_card: { title: "카드 단말기 (리더기) 대응", icon: "credit-card", type: "success", list: ["단말기선 재연결 및 재부팅\n전원선을 10초 뒤 다시 꽂아보세요.", "펌웨어 업데이트 확인\n카드가 정상적으로 읽히지 않으면 최신 펌웨어인지 확인하세요."] },
            res_setting: { title: "설정 및 기능 안내", icon: "settings", type: "success", list: ["관리자 페이지(어드민) 접속 여부 확인\n로그인 정보를 모를 경우 본사 확인이 필요합니다.", "메뉴 수정/품절 설정 안내\n판매관리 > 메뉴관리에서 수정 가능합니다.", "테이블 배치 편집 모드 안내\n환경설정에서 테이블 위치를 드래그할 수 있습니다.", "관련 매뉴얼 PDF 전송\n카카오톡 채널을 통해 링크를 전송하세요."] },
            res_payment: { title: "결제 및 내역 확인", icon: "credit-card", type: "success", warning: "개인정보 보호를 위해 전체 카드번호는 묻지 마세요.", list: ["통합 어드민 시스템 접속\n결제 조회 메뉴를 활용하세요.", "카드번호 앞 8자리, 결제 일시 확인\n정확한 조회를 위해 필요합니다.", "승인번호 조회\n영수증이 있다면 승인번호가 가장 정확합니다.", "카드사 반영 기간 안내\n취소 시 영업일 기준 3-5일 소요됨을 알리세요."] },
            res_paik_1: { title: "[빽다방] 프로그램 오류", icon: "alert-circle", type: "success", list: ["비버/우노스 버전 확인\n빽다방은 매장별로 버전이 상이할 수 있습니다.", "키오스크 재시작\n키오스크 후면의 스위치를 껐다 켜주세요.", "주방 프린터 출력 설정 확인\n포스에서 주방 출력 여부가 체크되어 있는지 보세요."] },
            res_paik_2: { title: "[빽다방] 장비 문제", icon: "hard-drive", type: "success", list: ["바코드 스캐너 인식 점검\n스캐너 유리에 이물질이 있는지 닦아보세요.", "영수증 프린터 헤드 청소\n인쇄가 흐릿할 경우 알코올 솜으로 닦으세요.", "카드 단말기 펌웨어 확인\n최신 버전이 아닐 경우 본사 업데이트 공지를 확인하세요."] },
            res_paik_3: { title: "[빽다방] 설정 및 쿠폰", icon: "settings", type: "success", warning: "본사 하달 공지사항을 반드시 먼저 확인하세요.", list: ["멤버십 쿠폰 적용 오류 확인\n고객의 앱 화면에서 유효기간을 확인하세요.", "신메뉴 옵션 설정 확인\n샷 추가, 당도 선택 등 옵션값이 맞는지 보세요.", "본사 프로모션 세팅 확인\n행사 품목의 가격이 0원으로 뜨는지 확인하세요."] },
            res_oq_1: { title: "[오더퀸] 프로그램 오류", icon: "alert-circle", type: "success", list: ["오더퀸 버전 확인\n최신 버전 업데이트 여부를 확인하세요.", "키오스크/포스 재시작\n기기를 재부팅하여 증상이 동일한지 확인합니다.", "원격 지원 연결\n오더퀸 전용 원격 프로그램으로 접속하세요."] },
            res_oq_2: { title: "[오더퀸] 장비 문제", icon: "hard-drive", type: "success", list: ["바코드 스캐너 점검\n스캐너 포트 연결 상태를 확인하세요.", "영수증 프린터 상태 확인\n용지 걸림 및 전원 상태를 체크하세요.", "카드 단말기 확인\n단말기 재부팅 및 케이블을 재연결해보세요."] },
            res_oq_3: { title: "[오더퀸] 설정 및 기능", icon: "settings", type: "success", list: ["메뉴 및 품절 설정\n오더퀸 관리자 웹에서 메뉴 설정을 확인하세요.", "키오스크 UI 설정\n관리자 페이지에서 화면 구성을 확인하세요.", "매장 운영 시간 변경\n영업시간 및 브레이크 타임 설정을 안내하세요."] },
            res_pay_service: { title: "결제 서비스 대응 (비버페이/바로페이/PG)", icon: "credit-card", type: "success", list: ["비버페이/바로페이 결제 누락 확인\n정산 페이지에서 해당 거래 건이 있는지 대조하세요.", "PG 결제 승인 여부 확인\n카드사 및 PG사 관리자 페이지에서 승인번호로 조회하세요.", "입금 예정 금액 확인\n정산 주기 및 수수료 제외 금액을 안내하세요.", "기타 결제 취소 요청 처리\n부분 취소 또는 전액 취소 가능 여부를 확인하세요."] }
        };

        const INITIAL_STEPS = {
            start: { id: "start", title: "1단계: 인사 및 경청", icon: "user", description: "\"안녕하세요. 비버매장연구소 입니다.\"\n고객의 불편 사항을 메모하며 끝까지 들어주세요.", choices: [{ id: "c1", label: "상황 파악 완료", sublabel: "문의 내용을 청취했습니다.", target: "program_check", icon: "chevron-right" }] },
            program_check: {
                id: "program_check", title: "2단계: 프로그램 확인", icon: "monitor", description: "고객이 현재 사용 중인 프로그램을 선택하세요.", choices: [
                    { id: "c2", label: "비버 (Beaver)", target: "category", icon: "chevron-right" },
                    { id: "c3", label: "우노스 (Unos)", target: "category", icon: "chevron-right" },
                    { id: "c4", label: "빽다방 (Paik's)", target: "paik_category", color: "amber", icon: "coffee" },
                    { id: "c5", label: "오더퀸 (OrderQueen)", target: "oq_category", color: "purple", icon: "chevron-right" },
                    { id: "c6", label: "비버페이 / 바로페이 / PG", sublabel: "결제내역 확인 및 기타문의", target: "res_pay_service", color: "emerald", icon: "credit-card" }
                ]
            },
            category: {
                id: "category", title: "3단계: 일반 문의 분류", icon: "message-square", description: "고객이 원하는 핵심 내용이 무엇인가요?", choices: [
                    { id: "c7", label: "프로그램 오류", target: "error_category" },
                    { id: "c8", label: "장비 문제", target: "hardware_category" },
                    { id: "c9", label: "설정 / 기능 문의", target: "res_setting" },
                    { id: "c10", label: "결제 내역 확인", target: "res_payment" }
                ]
            },
            error_category: {
                id: "error_category", title: "프로그램 오류 분류", icon: "alert-circle", description: "어떤 종류의 오류가 발생했나요?", choices: [
                    { id: "c_err1", label: "실행/로딩 오류", target: "res_err_run", icon: "power" },
                    { id: "c_err2", label: "결제 관련 오류", target: "res_err_pay", icon: "credit-card" },
                    { id: "c_err3", label: "기타 프로그램 오류", target: "res_error", icon: "alert-triangle" }
                ]
            },
            hardware_category: {
                id: "hardware_category", title: "장비 문제 분류", icon: "hard-drive", description: "어떤 장비에 문제가 발생했나요?", choices: [
                    { id: "c11", label: "포스기 / 키오스크", target: "res_hw_pos", icon: "monitor" },
                    { id: "c12", label: "프린터 (영수증/주방)", target: "res_hw_printer", icon: "printer" },
                    { id: "c13", label: "카드 단말기 (리더기)", target: "res_hw_card", icon: "credit-card" },
                    { id: "c14", label: "기타 일반 장비 대응", target: "res_hardware", icon: "tool" }
                ]
            },
            paik_category: {
                id: "paik_category", title: "빽다방 전용 대응", icon: "coffee", color: "amber", description: "점주님이 요청하신 항목을 선택하세요.", choices: [
                    { id: "c15", label: "1. 프로그램 오류", color: "amber", target: "res_paik_1" },
                    { id: "c16", label: "2. 장비 문제", color: "amber", target: "res_paik_2" },
                    { id: "c17", label: "3. 설정 / 기능", color: "amber", target: "res_paik_3" },
                    { id: "c18", label: "결제 내역 확인", color: "amber", target: "res_payment" }
                ]
            },
            oq_category: {
                id: "oq_category", title: "오더퀸 전용 대응", icon: "monitor", color: "purple", description: "점주님이 요청하신 항목을 선택하세요.", choices: [
                    { id: "c19", label: "1. 프로그램 오류", color: "purple", target: "res_oq_1" },
                    { id: "c20", label: "2. 장비 문제", color: "purple", target: "res_oq_2" },
                    { id: "c21", label: "3. 설정 / 기능", color: "purple", target: "res_oq_3" },
                    { id: "c22", label: "결제 내역 확인", color: "purple", target: "res_payment" }
                ]
            }
        };
