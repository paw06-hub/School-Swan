const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { DATA_FILE } = require('./config');

let memoryDb = {};
let saveTimeout = null;

function loadData() {
    const fullPath = path.join(__dirname, DATA_FILE);
    
    if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, JSON.stringify({}, null, 2));
        return {};
    }
    
    try {
        return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch (err) {
        console.error('❌ Lỗi đọc data:', err);
        return {};
    }
}

function queueSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    
    saveTimeout = setTimeout(async () => {
        try {
            const fullPath = path.join(__dirname, DATA_FILE);
            await fsPromises.writeFile(fullPath, JSON.stringify(memoryDb, null, 2));
        } catch (err) {
            console.error('❌ Lỗi lưu data:', err);
        }
    }, 2000);
}

function initGuild(guildId) {
    if (!memoryDb[guildId]) {
        memoryDb[guildId] = {
            config: {
                tenTruong: 'Swan School',
                admins: [],
                giaoVien: []
            },
            users: {}
        };
    }
    return memoryDb[guildId];
}

function initUser(guildId, userId) {
    initGuild(guildId);
    
    if (!memoryDb[guildId].users[userId]) {
        memoryDb[guildId].users[userId] = {
            // ═══ HỌC TẬP ═══
            diem: 0,
            xu: 500,
            cap: 1,
            hocLuc: 'Yếu',
            lop: null,
            
            // ═══ THỐNG KÊ ═══
            soLanDiemDanh: 0,
            soLanHoc: 0,
            soLanBTVN: 0,
            soLanThi: 0,
            soLanThuvien: 0,
            soLanDay: 0,
            
            // ═══ COOLDOWN ═══
            lastDiemDanh: 0,
            lastHoc: 0,
            lastBTVN: 0,
            lastThi: 0,
            lastThuvien: 0,
            lastDayHoc: 0,
            
            // ═══ XÃ HỘI ═══
            banBe: [],
            clb: [],
            
            // ═══ GIÁO VIÊN ═══
            isGiaoVien: false,
            monDay: [],
            lopDay: [],
            
            // ═══ THÀNH TÍCH ═══
            huyChuong: [],
            bangKhen: [],
            danhHieu: [],
            
            createdAt: Date.now(),
            lastActive: Date.now()
        };
    }
    return memoryDb[guildId].users[userId];
}

function getUser(guildId, userId) {
    return memoryDb[guildId]?.users?.[userId];
}

function getAllUsers(guildId) {
    return memoryDb[guildId]?.users || {};
}

function setMemoryDb(data) {
    memoryDb = data;
}

function getMemoryDb() {
    return memoryDb;
}

module.exports = {
    loadData,
    queueSave,
    initGuild,
    initUser,
    getUser,
    getAllUsers,
    setMemoryDb,
    getMemoryDb
};
