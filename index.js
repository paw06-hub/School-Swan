require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    REST,
    Routes,
    SlashCommandBuilder
} = require('discord.js');
const express = require('express');

const config = require('./config');
const { getCapBac, getCapTiepTheo, getHocLuc, getTienTrinh, getBar } = require('./level');
const { loadData, queueSave, initUser, setMemoryDb, getAllUsers } = require('./database');

// ═══════════════════════════════════════════════════════════════
//  WEB SERVER
// ═══════════════════════════════════════════════════════════════
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('🏫 Swan School Bot đang online!'));
app.get('/ping', (req, res) => res.status(200).send('PONG'));
app.listen(PORT, () => console.log(`🌐 Web server port ${PORT}`));

// ═══════════════════════════════════════════════════════════════
//  DISCORD CLIENT
// ═══════════════════════════════════════════════════════════════
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ═══════════════════════════════════════════════════════════════
//  HELPER
// ═══════════════════════════════════════════════════════════════
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

function checkCooldown(user, key, cooldownMs) {
    const lastUsed = user[key] || 0;
    const now = Date.now();
    const remaining = cooldownMs - (now - lastUsed);
    
    if (remaining > 0) {
        return { ok: false, remaining };
    }
    return { ok: true };
}

// ═══════════════════════════════════════════════════════════════
//  READY
// ═══════════════════════════════════════════════════════════════
client.once('ready', async () => {
    setMemoryDb(loadData());
    console.log(`🤖 Bot ${client.user.tag} đã online!`);
    
    try {
        const rest = new REST({ version: '10' }).setToken(config.TOKEN);
        
        const commands = [
            // ═══ HỌC SINH ═══
            new SlashCommandBuilder()
                .setName('truonghoc')
                .setDescription('🏫 Xem hồ sơ học sinh của bạn'),
            
            new SlashCommandBuilder()
                .setName('diemdanh')
                .setDescription('📅 Điểm danh hàng ngày'),
            
            new SlashCommandBuilder()
                .setName('hoc')
                .setDescription('📚 Vào lớp học'),
            
            new SlashCommandBuilder()
                .setName('btvn')
                .setDescription('📝 Làm bài tập về nhà'),
            
            new SlashCommandBuilder()
                .setName('thi')
                .setDescription('📝 Thi cử'),
            
            new SlashCommandBuilder()
                .setName('thuvien')
                .setDescription('📖 Học ở thư viện'),
            
            new SlashCommandBuilder()
                .setName('hocluc')
                .setDescription('🎯 Xem học lực của bạn'),
            
            new SlashCommandBuilder()
                .setName('bxh-truong')
                .setDescription('🏆 Bảng xếp hạng trường học'),
            
            // ═══ GIÁO VIÊN ═══
            new SlashCommandBuilder()
                .setName('giaovien')
                .setDescription('👨‍🏫 Xem hồ sơ giáo viên'),
            
            new SlashCommandBuilder()
                .setName('day-hoc')
                .setDescription('👨‍🏫 Dạy học sinh (Giáo viên)')
                .addUserOption(opt => opt.setName('user').setDescription('Học sinh').setRequired(true))
                .addStringOption(opt => opt.setName('mon').setDescription('Môn dạy').setRequired(true).addChoices(
                    { name: '📐 Toán', value: 'toan' },
                    { name: '📖 Văn', value: 'van' },
                    { name: '🌏 Anh', value: 'anh' },
                    { name: '🔬 Lý', value: 'ly' },
                    { name: '🧪 Hóa', value: 'hoa' },
                    { name: '🧬 Sinh', value: 'sinh' }
                )),
            
            new SlashCommandBuilder()
                .setName('cham-bai')
                .setDescription('📝 Chấm bài học sinh (Giáo viên)')
                .addUserOption(opt => opt.setName('user').setDescription('Học sinh').setRequired(true))
                .addIntegerOption(opt => opt.setName('diem').setDescription('Điểm (0-10)').setRequired(true).setMinValue(0).setMaxValue(10)),
            
            new SlashCommandBuilder()
                .setName('thuong-hs')
                .setDescription('🎁 Thưởng học sinh (Giáo viên)')
                .addUserOption(opt => opt.setName('user').setDescription('Học sinh').setRequired(true))
                .addIntegerOption(opt => opt.setName('diem').setDescription('Số điểm').setRequired(true).setMinValue(1)),
            
            new SlashCommandBuilder()
                .setName('phat-hs')
                .setDescription('⚠️ Phạt học sinh (Giáo viên)')
                .addUserOption(opt => opt.setName('user').setDescription('Học sinh').setRequired(true))
                .addIntegerOption(opt => opt.setName('diem').setDescription('Số điểm').setRequired(true).setMinValue(1)),
            
            new SlashCommandBuilder()
                .setName('diemdanh-lop')
                .setDescription('📋 Điểm danh lớp (Giáo viên)'),
            
            new SlashCommandBuilder()
                .setName('thongbao-lop')
                .setDescription('📢 Thông báo cho lớp (Giáo viên)')
                .addStringOption(opt => opt.setName('noidung').setDescription('Nội dung').setRequired(true)),
            
            new SlashCommandBuilder()
                .setName('ds-lop')
                .setDescription('📋 Xem danh sách lớp mình dạy (Giáo viên)'),
            
            // ═══ ADMIN ═══
            new SlashCommandBuilder()
                .setName('admin-setgv')
                .setDescription('👑 Bổ nhiệm giáo viên (Admin)')
                .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
                .addStringOption(opt => opt.setName('mon').setDescription('Môn dạy').setRequired(true).addChoices(
                    { name: '📐 Toán', value: 'toan' },
                    { name: '📖 Văn', value: 'van' },
                    { name: '🌏 Anh', value: 'anh' },
                    { name: '🔬 Lý', value: 'ly' },
                    { name: '🧪 Hóa', value: 'hoa' },
                    { name: '🧬 Sinh', value: 'sinh' }
                )),
            
            new SlashCommandBuilder()
                .setName('admin-removegv')
                .setDescription('👑 Tước quyền giáo viên (Admin)')
                .addUserOption(opt => opt.setName('user').setDescription('Giáo viên').setRequired(true)),
            
            new SlashCommandBuilder()
                .setName('admin-dsgv')
                .setDescription('👑 Xem danh sách giáo viên (Admin)'),
            
            new SlashCommandBuilder()
                .setName('admin-adddiem')
                .setDescription('👑 Cộng điểm học sinh (Admin)')
                .addUserOption(opt => opt.setName('user').setDescription('Học sinh').setRequired(true))
                .addIntegerOption(opt => opt.setName('diem').setDescription('Số điểm').setRequired(true).setMinValue(1)),
            
            new SlashCommandBuilder()
                .setName('admin-removecoin')
                .setDescription('👑 Trừ điểm học sinh (Admin)')
                .addUserOption(opt => opt.setName('user').setDescription('Học sinh').setRequired(true))
                .addIntegerOption(opt => opt.setName('diem').setDescription('Số điểm').setRequired(true).setMinValue(1)),
            
            new SlashCommandBuilder()
                .setName('admin-reset')
                .setDescription('👑 Reset học sinh (Admin)')
                .addUserOption(opt => opt.setName('user').setDescription('Học sinh').setRequired(true)),
            
            new SlashCommandBuilder()
                .setName('admin-setlop')
                .setDescription('👑 Set lớp cho học sinh (Admin)')
                .addUserOption(opt => opt.setName('user').setDescription('Học sinh').setRequired(true))
                .addStringOption(opt => opt.setName('lop').setDescription('Tên lớp (VD: 6A1)').setRequired(true))
        ];
        
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Đã đăng ký Slash Commands!');
    } catch (err) {
        console.error('❌ Lỗi đăng ký commands:', err);
    }
});

// ═══════════════════════════════════════════════════════════════
//  INTERACTION
// ═══════════════════════════════════════════════════════════════
client.on('interactionCreate', async (interaction) => {
    if (!interaction.guild) return;
    if (!interaction.isChatInputCommand()) return;
    
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const { commandName, options } = interaction;
    
    const user = initUser(guildId, userId);
    const isAdmin = config.ADMIN_IDS.includes(userId);
    const isGiaoVien = user.isGiaoVien === true;
    
    // ═══════════════════════════════════════════════════════════
    //  HỌC SINH COMMANDS
    // ═══════════════════════════════════════════════════════════
    
    // ═══ /truonghoc ═══
    if (commandName === 'truonghoc') {
        const capBac = getCapBac(user.diem);
        const capTiepTheo = getCapTiepTheo(user.diem);
        const hocLuc = getHocLuc(user.diem);
        const tienTrinh = getTienTrinh(user.diem);
        const bar = getBar(tienTrinh);
        
        let desc = `👤 **Học sinh:** ${interaction.user}\n`;
        desc += `📚 **Lớp:** ${user.lop || 'Chưa xếp lớp'}\n`;
        desc += `👨‍🏫 **Vai trò:** ${isGiaoVien ? '**Giáo viên**' : 'Học sinh'}\n`;
        desc += `⭐ **Cấp ${capBac.cap}:** ${capBac.ten}\n`;
        desc += `🎓 **Giai đoạn:** ${capBac.giaiDoan}\n\n`;
        desc += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        desc += `📊 **Điểm:** **${user.diem.toLocaleString('vi-VN')}**\n`;
        desc += `🎯 **Học lực:** ${hocLuc.icon} **${hocLuc.ten}**\n`;
        desc += `🪙 **Xu:** **${user.xu.toLocaleString('vi-VN')}** Xu\n\n`;
        
        if (capTiepTheo) {
            desc += `📈 **Tiến trình lên ${capTiepTheo.ten}:**\n`;
            desc += `\`${bar}\` **${tienTrinh}%**\n`;
            desc += `Cần thêm **${(capTiepTheo.diem - user.diem).toLocaleString('vi-VN')}** điểm\n`;
        } else {
            desc += `🏆 **ĐÃ ĐẠT CẤP TỐI ĐA!**\n`;
        }
        
        desc += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        desc += `📊 **Thống kê:**\n`;
        desc += `▫️ Điểm danh: **${user.soLanDiemDanh}** lần\n`;
        desc += `▫️ Vào lớp: **${user.soLanHoc}** lần\n`;
        desc += `▫️ Làm BTVN: **${user.soLanBTVN}** lần\n`;
        desc += `▫️ Thi cử: **${user.soLanThi}** lần\n`;
        desc += `▫️ Thư viện: **${user.soLanThuvien}** lần\n`;
        
        const embed = new EmbedBuilder()
            .setColor(hocLuc.color)
            .setTitle(`🏫 HỒ SƠ HỌC SINH`)
            .setDescription(desc)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: '🏫 Swan School' })
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══ /diemdanh ═══
    if (commandName === 'diemdanh') {
        const cd = checkCooldown(user, 'lastDiemDanh', config.COOLDOWN.DIEMDANH);
        
        if (!cd.ok) {
            return interaction.reply({
                content: `⏰ Bạn đã điểm danh rồi!\n💡 Quay lại sau **${formatTime(cd.remaining)}** nữa.`,
                ephemeral: true
            });
        }
        
        user.diem += config.POINTS.DIEMDANH;
        user.xu += config.MONEY.DIEMDANH;
        user.soLanDiemDanh += 1;
        user.lastDiemDanh = Date.now();
        
        queueSave();
        
        const embed = new EmbedBuilder()
            .setColor(config.COLORS.SUCCESS)
            .setTitle('✅ ĐIỂM DANH THÀNH CÔNG!')
            .setDescription(
                `📅 **Ngày:** <t:${Math.floor(Date.now() / 1000)}:D>\n\n` +
                `🎁 **Phần thưởng:**\n` +
                `📊 **+${config.POINTS.DIEMDANH}** điểm\n` +
                `🪙 **+${config.MONEY.DIEMDANH}** Xu\n\n` +
                `📈 **Tổng điểm:** **${user.diem.toLocaleString('vi-VN')}**\n` +
                `🔥 **Chuỗi điểm danh:** **${user.soLanDiemDanh}** lần`
            )
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══ /hoc ═══
    if (commandName === 'hoc') {
        const cd = checkCooldown(user, 'lastHoc', config.COOLDOWN.HOC);
        
        if (!cd.ok) {
            return interaction.reply({
                content: `⏰ Bạn vừa học xong!\n💡 Quay lại sau **${formatTime(cd.remaining)}** nữa.`,
                ephemeral: true
            });
        }
        
        user.diem += config.POINTS.HOC;
        user.xu += config.MONEY.HOC;
        user.soLanHoc += 1;
        user.lastHoc = Date.now();
        
        queueSave();
        
        const monKeys = Object.keys(config.MON_HOC);
        const monKey = monKeys[Math.floor(Math.random() * monKeys.length)];
        const mon = config.MON_HOC[monKey];
        
        const embed = new EmbedBuilder()
            .setColor(config.COLORS.PRIMARY)
            .setTitle('📚 VÀO LỚP THÀNH CÔNG!')
            .setDescription(
                `📖 **Môn học:** ${mon}\n\n` +
                `🎁 **Phần thưởng:**\n` +
                `📊 **+${config.POINTS.HOC}** điểm\n` +
                `🪙 **+${config.MONEY.HOC}** Xu\n\n` +
                `📈 **Tổng điểm:** **${user.diem.toLocaleString('vi-VN')}**`
            )
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══ /btvn ═══
    if (commandName === 'btvn') {
        const cd = checkCooldown(user, 'lastBTVN', config.COOLDOWN.BTVN);
        
        if (!cd.ok) {
            return interaction.reply({
                content: `⏰ Bạn vừa làm BTVN rồi!\n💡 Quay lại sau **${formatTime(cd.remaining)}** nữa.`,
                ephemeral: true
            });
        }
        
        user.diem += config.POINTS.BTVN;
        user.xu += config.MONEY.BTVN;
        user.soLanBTVN += 1;
        user.lastBTVN = Date.now();
        
        queueSave();
        
        const embed = new EmbedBuilder()
            .setColor(config.COLORS.INFO)
            .setTitle('📝 LÀM BTVN THÀNH CÔNG!')
            .setDescription(
                `📚 Bạn đã hoàn thành bài tập về nhà!\n\n` +
                `🎁 **Phần thưởng:**\n` +
                `📊 **+${config.POINTS.BTVN}** điểm\n` +
                `🪙 **+${config.MONEY.BTVN}** Xu\n\n` +
                `📈 **Tổng điểm:** **${user.diem.toLocaleString('vi-VN')}**`
            )
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══ /thi ═══
    if (commandName === 'thi') {
        const cd = checkCooldown(user, 'lastThi', config.COOLDOWN.THI);
        
        if (!cd.ok) {
            return interaction.reply({
                content: `⏰ Bạn vừa thi xong!\n💡 Quay lại sau **${formatTime(cd.remaining)}** nữa.`,
                ephemeral: true
            });
        }
        
        const diemThi = Math.floor(Math.random() * 71) + 30;
        const diemNhan = Math.floor(config.POINTS.THI * (diemThi / 100));
        const xuNhan = Math.floor(config.MONEY.THI * (diemThi / 100));
        
        user.diem += diemNhan;
        user.xu += xuNhan;
        user.soLanThi += 1;
        user.lastThi = Date.now();
        
        queueSave();
        
        let color = config.COLORS.SUCCESS;
        let danhGia = '🎉 Xuất sắc!';
        if (diemThi < 50) {
            color = config.COLORS.DANGER;
            danhGia = '😢 Cần cố gắng hơn!';
        } else if (diemThi < 70) {
            color = config.COLORS.WARNING;
            danhGia = '😐 Trung bình!';
        } else if (diemThi < 90) {
            color = config.COLORS.INFO;
            danhGia = '😊 Khá tốt!';
        }
        
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('📝 KẾT QUẢ THI')
            .setDescription(
                `📊 **Điểm thi:** **${diemThi}/100**\n` +
                `💬 **Đánh giá:** ${danhGia}\n\n` +
                `🎁 **Phần thưởng:**\n` +
                `📊 **+${diemNhan}** điểm\n` +
                `🪙 **+${xuNhan}** Xu\n\n` +
                `📈 **Tổng điểm:** **${user.diem.toLocaleString('vi-VN')}**`
            )
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══ /thuvien ═══
    if (commandName === 'thuvien') {
        const cd = checkCooldown(user, 'lastThuvien', config.COOLDOWN.THUVIEN);
        
        if (!cd.ok) {
            return interaction.reply({
                content: `⏰ Bạn vừa ở thư viện!\n💡 Quay lại sau **${formatTime(cd.remaining)}** nữa.`,
                ephemeral: true
            });
        }
        
        user.diem += config.POINTS.THUVIEN;
        user.xu += config.MONEY.THUVIEN;
        user.soLanThuvien += 1;
        user.lastThuvien = Date.now();
        
        queueSave();
        
        const sach = ['📕 Sách Toán', '📗 Sách Văn', '📘 Sách Anh', '📙 Sách Lý', '📔 Sách Hóa'];
        const sachChon = sach[Math.floor(Math.random() * sach.length)];
        
        const embed = new EmbedBuilder()
            .setColor(config.COLORS.INFO)
            .setTitle('📖 THƯ VIỆN')
            .setDescription(
                `📚 Bạn đã đọc: **${sachChon}**\n\n` +
                `🎁 **Phần thưởng:**\n` +
                `📊 **+${config.POINTS.THUVIEN}** điểm\n` +
                `🪙 **+${config.MONEY.THUVIEN}** Xu\n\n` +
                `📈 **Tổng điểm:** **${user.diem.toLocaleString('vi-VN')}**`
            )
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══ /hocluc ═══
    if (commandName === 'hocluc') {
        const hocLuc = getHocLuc(user.diem);
        const capBac = getCapBac(user.diem);
        const capTiepTheo = getCapTiepTheo(user.diem);
        
        let desc = `👤 **Học sinh:** ${interaction.user}\n`;
        desc += `⭐ **Cấp:** ${capBac.ten}\n\n`;
        desc += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        desc += `🎯 **Học lực:** ${hocLuc.icon} **${hocLuc.ten}**\n\n`;
        desc += `📊 **Điểm:** **${user.diem.toLocaleString('vi-VN')}**\n`;
        
        if (capTiepTheo) {
            desc += `\n🎯 **Cần thêm:** **${(capTiepTheo.diem - user.diem).toLocaleString('vi-VN')}** điểm để lên ${capTiepTheo.ten}`;
        } else {
            desc += `\n🏆 **Bạn đã đạt cấp cao nhất!**`;
        }
        
        const embed = new EmbedBuilder()
            .setColor(hocLuc.color)
            .setTitle('🎯 HỌC LỰC')
            .setDescription(desc)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══ /bxh-truong ═══
    if (commandName === 'bxh-truong') {
        const allUsers = getAllUsers(guildId);
        
        const sorted = Object.entries(allUsers)
            .map(([uid, u]) => ({ uid, diem: u.diem || 0 }))
            .filter(u => u.diem > 0)
            .sort((a, b) => b.diem - a.diem)
            .slice(0, 10);
        
        if (sorted.length === 0) {
            return interaction.reply({
                content: '📭 Chưa có ai trong BXH!',
                ephemeral: true
            });
        }
        
        let text = '';
        for (let i = 0; i < sorted.length; i++) {
            const u = sorted[i];
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
            const capBac = getCapBac(u.diem);
            text += `${medal} <@${u.uid}> — **${u.diem.toLocaleString('vi-VN')}** điểm (${capBac.ten})\n`;
        }
        
        const embed = new EmbedBuilder()
            .setColor(config.COLORS.GOLD)
            .setTitle('🏆 BẢNG XẾP HẠNG TRƯỜNG HỌC')
            .setDescription(text)
            .setFooter({ text: '🏫 Swan School' })
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══════════════════════════════════════════════════════════
    //  GIÁO VIÊN COMMANDS
    // ═══════════════════════════════════════════════════════════
    
    // ═══ /giaovien ═══
    if (commandName === 'giaovien') {
        if (!isGiaoVien) {
            return interaction.reply({
                content: '❌ Bạn không phải là **Giáo viên**!',
                ephemeral: true
            });
        }
        
        let desc = `👨‍🏫 **Giáo viên:** ${interaction.user}\n\n`;
        desc += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        desc += `📚 **Môn dạy:**\n`;
        if (user.monDay && user.monDay.length > 0) {
            desc += user.monDay.map(m => `▫️ ${config.MON_HOC[m] || m}`).join('\n') + '\n';
        } else {
            desc += `*Chưa có môn*\n`;
        }
        desc += `\n🏫 **Lớp dạy:**\n`;
        if (user.lopDay && user.lopDay.length > 0) {
            desc += user.lopDay.map(l => `▫️ ${l}`).join('\n') + '\n';
        } else {
            desc += `*Chưa có lớp*\n`;
        }
        desc += `\n📊 **Số lần dạy:** **${user.soLanDay || 0}**\n`;
        
        const embed = new EmbedBuilder()
            .setColor(config.COLORS.INFO)
            .setTitle('👨‍🏫 HỒ SƠ GIÁO VIÊN')
            .setDescription(desc)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: '🏫 Swan School' })
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══ /day-hoc ═══
    if (commandName === 'day-hoc') {
        if (!isGiaoVien) {
            return interaction.reply({
                content: '❌ Chỉ **Giáo viên** mới dạy học được!',
                ephemeral: true
            });
        }
        
        const targetUser = options.getUser('user');
        const mon = options.getString('mon');
        
        if (targetUser.bot) {
            return interaction.reply({ content: '❌ Không thể dạy bot!', ephemeral: true });
        }
        if (targetUser.id === userId) {
            return interaction.reply({ content: '❌ Không thể tự dạy chính mình!', ephemeral: true });
        }
        
        if (!user.monDay.includes(mon)) {
            return interaction.reply({
                content: `❌ Bạn không dạy môn **${config.MON_HOC[mon]}**!`,
                ephemeral: true
            });
        }
        
        const cd = checkCooldown(user, 'lastDayHoc', config.COOLDOWN.DAYHOC);
        if (!cd.ok) {
            return interaction.reply({
                content: `⏰ Bạn vừa dạy xong!\n💡 Quay lại sau **${formatTime(cd.remaining)}** nữa.`,
                ephemeral: true
            });
        }
        
        const targetData = initUser(guildId, targetUser.id);
        
        const diemNhan = config.POINTS.DAYHOC;
        const xuNhan = config.MONEY.DAYHOC;
        
        targetData.diem += diemNhan;
        targetData.xu += xuNhan;
        
        user.soLanDay = (user.soLanDay || 0) + 1;
        user.lastDayHoc = Date.now();
        
        queueSave();
        
        const embed = new EmbedBuilder()
            .setColor(config.COLORS.PRIMARY)
            .setTitle('👨‍🏫 DẠY HỌC THÀNH CÔNG!')
            .setDescription(
                `👨‍🏫 **Giáo viên:** ${interaction.user}\n` +
                `👤 **Học sinh:** ${targetUser}\n` +
                `📖 **Môn:** ${config.MON_HOC[mon]}\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `🎁 **Học sinh nhận:**\n` +
                `📊 **+${diemNhan}** điểm\n` +
                `🪙 **+${xuNhan}** Xu`
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══ /cham-bai ═══
    if (commandName === 'cham-bai') {
        if (!isGiaoVien) {
            return interaction.reply({ content: '❌ Chỉ **Giáo viên** mới chấm bài!', ephemeral: true });
        }
        
        const targetUser = options.getUser('user');
        const diemBai = options.getInteger('diem');
        
        const targetData = initUser(guildId, targetUser.id);
        
        const diemNhan = diemBai * 10;
        targetData.diem += diemNhan;
        
        queueSave();
        
        const embed = new EmbedBuilder()
            .setColor(diemBai >= 8 ? config.COLORS.SUCCESS : diemBai >= 5 ? config.COLORS.WARNING : config.COLORS.DANGER)
            .setTitle('📝 CHẤM BÀI')
            .setDescription(
                `👨‍🏫 **Giáo viên:** ${interaction.user}\n` +
                `👤 **Học sinh:** ${targetUser}\n` +
                `📊 **Điểm bài:** **${diemBai}/10**\n\n` +
                `🎁 **Học sinh nhận:** **+${diemNhan}** điểm`
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══ /thuong-hs ═══
    if (commandName === 'thuong-hs') {
        if (!isGiaoVien) {
            return interaction.reply({ content: '❌ Chỉ **Giáo viên** mới thưởng!', ephemeral: true });
        }
        
        const targetUser = options.getUser('user');
        const diemThuong = options.getInteger('diem');
        
        const targetData = initUser(guildId, targetUser.id);
        targetData.diem += diemThuong;
        
        queueSave();
        
        const embed = new EmbedBuilder()
            .setColor(config.COLORS.SUCCESS)
            .setTitle('🎁 THƯỞNG HỌC SINH')
            .setDescription(
                `👨‍🏫 **Giáo viên:** ${interaction.user}\n` +
                `👤 **Học sinh:** ${targetUser}\n\n` +
                `🎁 **Thưởng:** **+${diemThuong}** điểm`
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══ /phat-hs ═══
    if (commandName === 'phat-hs') {
        if (!isGiaoVien) {
            return interaction.reply({ content: '❌ Chỉ **Giáo viên** mới phạt!', ephemeral: true });
        }
        
        const targetUser = options.getUser('user');
        const diemPhat = options.getInteger('diem');
        
        const targetData = initUser(guildId, targetUser.id);
        targetData.diem = Math.max(0, targetData.diem - diemPhat);
        
        queueSave();
        
        const embed = new EmbedBuilder()
            .setColor(config.COLORS.DANGER)
            .setTitle('⚠️ PHẠT HỌC SINH')
            .setDescription(
                `👨‍🏫 **Giáo viên:** ${interaction.user}\n` +
                `👤 **Học sinh:** ${targetUser}\n\n` +
                `⚠️ **Phạt:** **-${diemPhat}** điểm`
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══ /diemdanh-lop ═══
    if (commandName === 'diemdanh-lop') {
        if (!isGiaoVien) {
            return interaction.reply({ content: '❌ Chỉ **Giáo viên**!', ephemeral: true });
        }
        
        const allUsers = getAllUsers(guildId);
        const hsTrongLop = Object.entries(allUsers)
            .filter(([uid, u]) => u.lop && user.lopDay && user.lopDay.includes(u.lop))
            .map(([uid]) => uid);
        
        if (hsTrongLop.length === 0) {
            return interaction.reply({ content: '📭 Lớp chưa có HS!', ephemeral: true });
        }
        
        let text = '';
        for (const uid of hsTrongLop) {
            text += `✅ <@${uid}>\n`;
        }
        
        const embed = new EmbedBuilder()
            .setColor(config.COLORS.SUCCESS)
            .setTitle('📋 ĐIỂM DANH LỚP')
            .setDescription(
                `👨‍🏫 **Giáo viên:** ${interaction.user}\n` +
                `📊 **Tổng HS:** **${hsTrongLop.length}**\n\n` +
                `${text}`
            )
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══ /thongbao-lop ═══
    if (commandName === 'thongbao-lop') {
        if (!isGiaoVien) {
            return interaction.reply({ content: '❌ Chỉ **Giáo viên**!', ephemeral: true });
        }
        
        const noidung = options.getString('noidung');
        
        const embed = new EmbedBuilder()
            .setColor(config.COLORS.INFO)
            .setTitle('📢 THÔNG BÁO TỪ GIÁO VIÊN')
            .setDescription(noidung)
            .setFooter({ text: `GV: ${interaction.user.username}` })
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══ /ds-lop ═══
    if (commandName === 'ds-lop') {
        if (!isGiaoVien) {
            return interaction.reply({ content: '❌ Chỉ **Giáo viên**!', ephemeral: true });
        }
        
        const allUsers = getAllUsers(guildId);
        const hsTrongLop = Object.entries(allUsers)
            .filter(([uid, u]) => u.lop && user.lopDay && user.lopDay.includes(u.lop))
            .map(([uid, u]) => ({ uid, diem: u.diem || 0, lop: u.lop }));
        
        if (hsTrongLop.length === 0) {
            return interaction.reply({ content: '📭 Lớp chưa có HS!', ephemeral: true });
        }
        
        let text = '';
        for (const hs of hsTrongLop) {
            const capBac = getCapBac(hs.diem);
            text += `▫️ <@${hs.uid}> — **${hs.diem.toLocaleString('vi-VN')}** điểm (${capBac.ten})\n`;
        }
        
        const embed = new EmbedBuilder()
            .setColor(config.COLORS.PRIMARY)
            .setTitle('📋 DANH SÁCH HỌC SINH')
            .setDescription(
                `👨‍🏫 **Giáo viên:** ${interaction.user}\n` +
                `📊 **Tổng HS:** **${hsTrongLop.length}**\n\n` +
                `${text}`
            )
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══════════════════════════════════════════════════════════
    //  ADMIN COMMANDS
    // ═══════════════════════════════════════════════════════════
    
    // ═══ /admin-setgv ═══
    if (commandName === 'admin-setgv') {
        if (!isAdmin) {
            return interaction.reply({ content: '❌ Chỉ Admin bot!', ephemeral: true });
        }
        
        const targetUser = options.getUser('user');
        const mon = options.getString('mon');
        
        if (targetUser.bot) {
            return interaction.reply({ content: '❌ Không thể set GV cho bot!', ephemeral: true });
        }
        
        const targetData = initUser(guildId, targetUser.id);
        
        targetData.isGiaoVien = true;
        if (!targetData.monDay) targetData.monDay = [];
        if (!targetData.monDay.includes(mon)) {
            targetData.monDay.push(mon);
        }
        
        queueSave();
        
        const embed = new EmbedBuilder()
            .setColor(config.COLORS.GOLD)
            .setTitle('👑 BỔ NHIỆM GIÁO VIÊN')
            .setDescription(
                `👤 **User:** ${targetUser}\n` +
                `👨‍🏫 **Môn dạy:** ${config.MON_HOC[mon]}\n\n` +
                `✅ Đã bổ nhiệm thành công!`
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({ text: `Admin: ${interaction.user.username}` })
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══ /admin-removegv ═══
    if (commandName === 'admin-removegv') {
        if (!isAdmin) {
            return interaction.reply({ content: '❌ Chỉ Admin bot!', ephemeral: true });
        }
        
        const targetUser = options.getUser('user');
        const targetData = initUser(guildId, targetUser.id);
        
        if (!targetData.isGiaoVien) {
            return interaction.reply({
                content: `❌ **${targetUser.username}** không phải giáo viên!`,
                ephemeral: true
            });
        }
        
        targetData.isGiaoVien = false;
        targetData.monDay = [];
        targetData.lopDay = [];
        
        queueSave();
        
        return interaction.reply({
            content: `✅ Đã tước quyền GV của **${targetUser.username}**!`
        });
    }
    
    // ═══ /admin-dsgv ═══
    if (commandName === 'admin-dsgv') {
        if (!isAdmin) {
            return interaction.reply({ content: '❌ Chỉ Admin bot!', ephemeral: true });
        }
        
        const allUsers = getAllUsers(guildId);
        const dsGV = Object.entries(allUsers)
            .filter(([uid, u]) => u.isGiaoVien === true)
            .map(([uid, u]) => ({ uid, monDay: u.monDay || [] }));
        
        if (dsGV.length === 0) {
            return interaction.reply({ content: '📭 Chưa có giáo viên nào!', ephemeral: true });
        }
        
        let text = '';
        for (const gv of dsGV) {
            const mons = gv.monDay.map(m => config.MON_HOC[m] || m).join(', ');
            text += `▫️ <@${gv.uid}> — ${mons || '*Chưa có môn*'}\n`;
        }
        
        const embed = new EmbedBuilder()
            .setColor(config.COLORS.GOLD)
            .setTitle('👨‍🏫 DANH SÁCH GIÁO VIÊN')
            .setDescription(
                `📊 **Tổng GV:** **${dsGV.length}**\n\n` +
                `${text}`
            )
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    }
    
    // ═══ /admin-adddiem ═══
    if (commandName === 'admin-adddiem') {
        if (!isAdmin) return interaction.reply({ content: '❌ Chỉ Admin bot!', ephemeral: true });
        
        const targetUser = options.getUser('user');
        const diem = options.getInteger('diem');
        
        const targetData = initUser(guildId, targetUser.id);
        targetData.diem += diem;
        
        queueSave();
        
        return interaction.reply(`✅ Đã cộng **${diem}** điểm cho **${targetUser.username}**!`);
    }
    
    // ═══ /admin-removecoin ═══
    if (commandName === 'admin-removecoin') {
        if (!isAdmin) return interaction.reply({ content: '❌ Chỉ Admin bot!', ephemeral: true });
        
        const targetUser = options.getUser('user');
        const diem = options.getInteger('diem');
        
        const targetData = initUser(guildId, targetUser.id);
        targetData.diem = Math.max(0, targetData.diem - diem);
        
        queueSave();
        
        return interaction.reply(`✅ Đã trừ **${diem}** điểm của **${targetUser.username}**!`);
    }
    
    // ═══ /admin-reset ═══
    if (commandName === 'admin-reset') {
        if (!isAdmin) return interaction.reply({ content: '❌ Chỉ Admin bot!', ephemeral: true });
        
        const targetUser = options.getUser('user');
        const targetData = initUser(guildId, targetUser.id);
        
        targetData.diem = 0;
        targetData.xu = 500;
        targetData.soLanDiemDanh = 0;
        targetData.soLanHoc = 0;
        targetData.soLanBTVN = 0;
        targetData.soLanThi = 0;
        targetData.soLanThuvien = 0;
        
        queueSave();
        
        return interaction.reply(`✅ Đã reset học sinh **${targetUser.username}**!`);
    }
    
    // ═══ /admin-setlop ═══
    if (commandName === 'admin-setlop') {
        if (!isAdmin) return interaction.reply({ content: '❌ Chỉ Admin bot!', ephemeral: true });
        
        const targetUser = options.getUser('user');
        const lop = options.getString('lop').trim();
        
        const targetData = initUser(guildId, targetUser.id);
        targetData.lop = lop;
        
        queueSave();
        
        return interaction.reply(`✅ Đã set lớp **${lop}** cho **${targetUser.username}**!`);
    }
});

// ═══════════════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════════════
client.login(config.TOKEN);
