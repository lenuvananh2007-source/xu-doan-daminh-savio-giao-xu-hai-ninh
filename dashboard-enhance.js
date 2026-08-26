window.dashboard=function(){setHead('Tổng quan Xứ đoàn','Năm hoạt động 2026–2028');page.innerHTML=`
<section class="dash-hero">
  <div class="dash-hero-copy">
    <span class="eyebrow">XỨ ĐOÀN ĐAMINH SAVIO · GIÁO XỨ HẢI NINH</span>
    <h1>Hiệp nhất để cùng lớn lên trong Đức tin</h1>
    <p>Trung tâm điều hành dành cho Ban Điều Hành, Giáo lý viên, Huynh trưởng và Đoàn sinh.</p>
    <div class="hero-actions">
      <button class="hero-primary" onclick="catechism('Lớp Khai Tâm','schedule')">📅 Xem lịch giáo lý</button>
      <button class="hero-secondary" onclick="document.getElementById('notificationBtn')?.click()">🔔 Xem thông báo</button>
    </div>
  </div>
  <div class="dash-hero-symbol"><div class="symbol-ring"><span>DS</span><small>2026–2028</small></div></div>
</section>

<section class="dash-metrics">
  <article class="metric-card mc-blue"><div class="metric-icon">👥</div><div><span>Thành viên</span><strong>159</strong><small>Toàn Xứ đoàn</small></div></article>
  <article class="metric-card mc-green"><div class="metric-icon">🕊️</div><div><span>Ngành / nhóm</span><strong>5</strong><small>Đang hoạt động</small></div></article>
  <article class="metric-card mc-gold"><div class="metric-icon">📖</div><div><span>Lớp giáo lý</span><strong>5</strong><small>Chương trình 2 năm</small></div></article>
  <article class="metric-card mc-purple"><div class="metric-icon">🔔</div><div><span>Bài tập mới</span><strong id="dashNoticeCount">0</strong><small>Từ giáo lý viên</small></div></article>
</section>

<section class="dash-layout">
  <div class="dash-main-col">
    <article class="dash-panel next-class-panel">
      <div class="panel-head"><div><span class="section-kicker">GIÁO LÝ</span><h2>Lịch học sắp tới</h2></div><button class="link-btn" onclick="catechism('Lớp Khai Tâm','schedule')">Xem toàn bộ →</button></div>
      <div class="timeline-list">
        <div class="timeline-item featured"><div class="date-box"><b>06</b><span>THÁNG 9</span></div><div class="timeline-copy"><span class="tag">Khai giảng</span><h3>Khai giảng năm học giáo lý 2026–2027</h3><p>Chào cờ · Tổng kết hè · Huấn đức · Thánh lễ cầu nguyện cho năm học mới</p></div></div>
        <div class="timeline-item"><div class="date-box"><b>13</b><span>THÁNG 9</span></div><div class="timeline-copy"><h3>Chúa nhật XXIV Mùa Thường Niên</h3><p>Các lớp học theo chương trình giáo lý đã phân.</p></div></div>
        <div class="timeline-item"><div class="date-box"><b>20</b><span>THÁNG 9</span></div><div class="timeline-copy"><h3>Chúa nhật XXV Mùa Thường Niên</h3><p>Tiếp tục bài học theo từng khối.</p></div></div>
      </div>
    </article>

    <article class="dash-panel">
      <div class="panel-head"><div><span class="section-kicker">THÀNH VIÊN</span><h2>Quy mô theo ngành</h2></div><button class="link-btn" onclick="members('Tất cả thành viên')">Mở danh sách →</button></div>
      <div class="branch-bars">
        ${branches.map((x,i)=>`<div class="branch-bar-row"><div class="branch-name"><span>${x[0]}</span><b>${x[1]}</b></div><div class="bar-track"><div class="bar-fill bar-${i+1}" style="width:${Math.round(x[1]/37*100)}%"></div></div></div>`).join('')}
      </div>
    </article>
  </div>

  <div class="dash-side-col">
    <article class="dash-panel focus-panel">
      <div class="panel-head"><div><span class="section-kicker">MỐC QUAN TRỌNG</span><h2>Kiểm tra năm 1</h2></div></div>
      <div class="milestone"><span class="mile-dot"></span><div><b>15/11/2026</b><p>Kiểm tra giữa kỳ I</p></div></div>
      <div class="milestone"><span class="mile-dot"></span><div><b>31/01/2027</b><p>Kiểm tra cuối học kỳ I</p></div></div>
      <div class="milestone"><span class="mile-dot"></span><div><b>13/06/2027</b><p>Kiểm tra cuối học kỳ II</p></div></div>
      <button class="wide-soft-btn" onclick="catechism('Lớp Đến Bàn Tiệc Thánh','grades')">Xem hệ thống điểm</button>
    </article>

    <article class="dash-panel quick-panel">
      <div class="panel-head"><div><span class="section-kicker">TRUY CẬP NHANH</span><h2>Việc thường dùng</h2></div></div>
      <div class="quick-grid">
        <button onclick="members('Ban Điều Hành')"><span>♜</span><b>BĐH</b></button>
        <button onclick="catechism('Lớp Thêm Sức','attendance')"><span>✓</span><b>Điểm danh</b></button>
        <button onclick="finance()"><span>₫</span><b>Tài chính</b></button>
        <button onclick="accounts('Tài khoản BĐH')"><span>◉</span><b>Tài khoản</b></button>
      </div>
    </article>

    <article class="dash-panel quote-panel">
      <div class="quote-mark">“</div><p>Thiếu nhi Thánh Thể sống ngày hôm nay bằng tinh thần cầu nguyện, rước lễ, hy sinh và làm việc tông đồ.</p><span>— Tinh thần TNTT</span>
    </article>
  </div>
</section>`;
try{let items=JSON.parse(localStorage.getItem('tnttAssignments')||'[]');let el=document.getElementById('dashNoticeCount');if(el)el.textContent=items.length}catch(e){}
};
setTimeout(()=>{if(typeof dashboard==='function')dashboard()},0);