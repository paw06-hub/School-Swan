// ═══ CẤP BẬC ═══
const LEVELS = [
    { cap: 1,  ten: '🍼 Mẫu giáo',       diem: 0,       giaiDoan: 'Tiểu học' },
    { cap: 2,  ten: '📗 Lớp 1',           diem: 50,      giaiDoan: 'Tiểu học' },
    { cap: 3,  ten: '📗 Lớp 2',           diem: 150,     giaiDoan: 'Tiểu học' },
    { cap: 4,  ten: '📗 Lớp 3',           diem: 300,     giaiDoan: 'Tiểu học' },
    { cap: 5,  ten: '📗 Lớp 4',           diem: 500,     giaiDoan: 'Tiểu học' },
    { cap: 6,  ten: '📗 Lớp 5',           diem: 800,     giaiDoan: 'Tiểu học' },
    { cap: 7,  ten: '📘 Lớp 6',           diem: 1500,    giaiDoan: 'THCS' },
    { cap: 8,  ten: '📘 Lớp 7',           diem: 2200,    giaiDoan: 'THCS' },
    { cap: 9,  ten: '📘 Lớp 8',           diem: 3000,    giaiDoan: 'THCS' },
    { cap: 10, ten: '📘 Lớp 9',           diem: 4000,    giaiDoan: 'THCS' },
    { cap: 11, ten: '📙 Lớp 10',          diem: 7000,    giaiDoan: 'THPT' },
    { cap: 12, ten: '📙 Lớp 11',          diem: 10000,   giaiDoan: 'THPT' },
    { cap: 13, ten: '📙 Lớp 12',          diem: 15000,   giaiDoan: 'THPT' },
    { cap: 14, ten: '🎓 SV năm 1',         diem: 25000,   giaiDoan: 'Đại học' },
    { cap: 15, ten: '🎓 SV năm 2',         diem: 32000,   giaiDoan: 'Đại học' },
    { cap: 16, ten: '🎓 SV năm 3',         diem: 40000,   giaiDoan: 'Đại học' },
    { cap: 17, ten: '🎓 SV năm 4',         diem: 50000,   giaiDoan: 'Đại học' },
    { cap: 18, ten: '💼 Thực tập sinh',    diem: 70000,   giaiDoan: 'Sự nghiệp' },
    { cap: 19, ten: '💼 Nhân viên',        diem: 85000,   giaiDoan: 'Sự nghiệp' },
    { cap: 20, ten: '💼 Chuyên viên',      diem: 100000,  giaiDoan: 'Sự nghiệp' },
    { cap: 21, ten: '💼 Trưởng phòng',     diem: 150000,  giaiDoan: 'Sự nghiệp' },
    { cap: 22, ten: '💼 Giám đốc',         diem: 250000,  giaiDoan: 'Sự nghiệp' },
    { cap: 23, ten: '💼 Tổng giám đốc',    diem: 500000,  giaiDoan: 'Sự nghiệp' },
    { cap: 24, ten: '👑 Triệu phú',        diem: 1000000, giaiDoan: 'Sự nghiệp' }
];

// ═══ HỌC LỰC ═══
const HOC_LUC = [
    { ten: 'Yếu',        icon: '🔴', min: 0,      max: 500,       color: '#E74C3C' },
    { ten: 'Trung bình', icon: '🟠', min: 500,    max: 2000,      color: '#F39C12' },
    { ten: 'Khá',        icon: '🟡', min: 2000,   max: 10000,     color: '#F1C40F' },
    { ten: 'Giỏi',       icon: '🟢', min: 10000,  max: 50000,     color: '#2ECC71' },
    { ten: 'Xuất sắc',   icon: '🔵', min: 50000,  max: 200000,    color: '#3498DB' },
    { ten: 'Thần đồng',  icon: '🟣', min: 200000, max: 999999999, color: '#9B59B6' }
];

function getCapBac(diem) {
    let capBac = LEVELS[0];
    for (const lv of LEVELS) {
        if (diem >= lv.diem) capBac = lv;
        else break;
    }
    return capBac;
}

function getCapTiepTheo(diem) {
    for (const lv of LEVELS) {
        if (diem < lv.diem) return lv;
    }
    return null;
}

function getHocLuc(diem) {
    for (const hl of HOC_LUC) {
        if (diem >= hl.min && diem < hl.max) return hl;
    }
    return HOC_LUC[0];
}

function getTienTrinh(diem) {
    const capHT = getCapBac(diem);
    const capTT = getCapTiepTheo(diem);
    
    if (!capTT) return 100;
    
    const dHT = diem - capHT.diem;
    const dCan = capTT.diem - capHT.diem;
    
    return Math.min(100, Math.floor((dHT / dCan) * 100));
}

function getBar(pct) {
    const filled = Math.floor(pct / 5);
    return '█'.repeat(filled) + '░'.repeat(20 - filled);
}

module.exports = {
    LEVELS,
    HOC_LUC,
    getCapBac,
    getCapTiepTheo,
    getHocLuc,
    getTienTrinh,
    getBar
};
