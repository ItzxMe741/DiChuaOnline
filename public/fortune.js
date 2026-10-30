// Quán Âm Linh Xăm - Dữ liệu 12 Quẻ Xăm Cầu Bình An & Tu Tập
const FORTUNE_POEMS = [
    {
        id: 1,
        title: "Quẻ Số 1 - Thượng Thượng (Đại Cát)",
        poem: "Cây khô gặp tiết nở trăm hoa,\nPhúc đức tiền nhân rạng cửa nhà.\nMột dạ chí tâm cầu Tam Bảo,\nBình an khang thái vạn sự hòa.",
        meaning: "Vận hội hanh thông, công đức tổ tiên sâu dày. Gia đạo bình an, việc làm ăn và học tập đều gặp duyên lành. Khuyên nên giữ tâm lương thiện, siêng làm việc từ thiện phóng sinh để phúc trọn vẹn.",
        advice: "Tâm bình thế giới bình. Hãy phát nguyện làm lành lánh dữ."
    },
    {
        id: 2,
        title: "Quẻ Số 2 - Thượng Kiết (Rất Tốt)",
        poem: "Trăng thanh gió mát chốn thiền môn,\nLắng đọng trần duyên sạch cõi lòng.\nBồ Tát Quan Âm ban phúc thọ,\nTâm thành tất ứng tựa non sông.",
        meaning: "Lòng sáng tỏ như trăng rằm, mọi băn khoăn khúc mắc sắp được tháo gỡ. Đi xa hay ở gần đều có quý nhân trợ giúp. Cầu sức khỏe cho bản thân và cha mẹ đều được an yên.",
        advice: "Hãy giữ lòng thanh tịnh, nghe kinh niệm Phật để tăng trưởng trí tuệ."
    },
    {
        id: 3,
        title: "Quẻ Số 3 - Trung Kiết (Bình An)",
        poem: "Nước biếc non xanh cảnh hữu tình,\nĐường đời chậm bước chớ tranh giành.\nThuận theo nhân quả tâm an lạc,\nHoa nở đúng mùa quả ngọt lành.",
        meaning: "Mọi việc nên thuận theo tự nhiên, chớ nên nóng vội hay ganh đua nơi thế tục. Cứ kiên trì gieo hạt giống tốt, quả ngọt ắt sẽ đến đúng lúc.",
        advice: "Học hạnh nhẫn nhục của Phật, dĩ hòa vi quý trong giao tiếp hàng ngày."
    },
    {
        id: 4,
        title: "Quẻ Số 4 - Thượng Bình (Ổn Định)",
        poem: "Gió sớm hương trầm thoảng ngát bay,\nThành tâm niệm Phật tháng cùng ngày.\nHoạn nạn tiêu trừ tiêu tội chướng,\nAn vui tự tại chốn trần ai.",
        meaning: "Gặp hung hóa cát, những trắc trở trước đây sẽ dần tan biến nhờ tâm niệm hướng thiện. Gia đình hòa thuận, con cháu chăm ngoan.",
        advice: "Năng thắp nhang bàn thờ tổ tiên, sống hiếu thảo với song thân phụ mẫu."
    },
    {
        id: 5,
        title: "Quẻ Số 5 - Thượng Cát (Như Ý)",
        poem: "Sen hồng hé nở chốn đài sen,\nTrí tuệ bừng soi phá tối hèn.\nĐường lối rõ ràng tâm vững chãi,\nBình an vạn nẻo ánh từ quang.",
        meaning: "Trí tuệ hanh thông, nếu đang thi cử, khởi sự công việc mới hay cầu tài cầu đạo đều có kết quả xứng đáng với công sức bỏ ra.",
        advice: "Giữ tâm khiêm hạ, chớ kiêu căng tự mãn, luôn hồi hướng công đức cho tha nhân."
    },
    {
        id: 6,
        title: "Quẻ Số 6 - Trung Bình (Khuyên Tu Dưỡng)",
        poem: "Bến vắng đò đưa đợi khách xưa,\nDuyên trần chưa dứt chớ mong thừa.\nTĩnh tâm quán chiếu thân tâm lại,\nSương tan nắng ấm ấm ban trưa.",
        meaning: "Hiện tại thời cơ chưa chín muồi, nên bình tĩnh tích lũy năng lực và đạo đức. Chớ vội vàng đầu tư mạo hiểm hay quyết định việc lớn trong lúc tâm xao động.",
        advice: "Dành thời gian ngồi thiền, lạy Phật sám hối để tâm trí tĩnh lặng, sáng suốt."
    },
    {
        id: 7,
        title: "Quẻ Số 7 - Thượng Thượng (Phước Lộc Trùng Lai)",
        poem: "Chuông chùa ngân sớm giải phiền ưu,\nTrời Phật chứng minh dạ dãi dầu.\nBao tháng gian nan nay đền đáp,\nCửa nhà ấm cúng dứt âu sầu.",
        meaning: "Qua cơn bĩ cực đến hồi thái lai. Những vất vả chịu đựng suốt thời gian qua đã đến ngày hưởng trái ngọt. Vợ chồng hòa thuận, thân thể khỏe mạnh.",
        advice: "Ăn quả nhớ kẻ trồng cây, đền ơn đáp nghĩa những người đã từng giúp đỡ mình."
    },
    {
        id: 8,
        title: "Quẻ Số 8 - Thượng Kiết (Vạn Sự Tùy Duyên)",
        poem: "Bồ Đề bóng mát tỏa ngàn phương,\nSoi lối người đi dứt bụi đường.\nTừ bi hỷ xả lòng không vướng,\nĐi đâu cũng gặp chốn yêu thương.",
        meaning: "Các mối quan hệ xã hội, gia đình và bạn bè đang rất tốt đẹp. Nhờ sống chân thành và bao dung nên đi đâu cũng được người yêu kẻ mến, hộ trì giúp đỡ.",
        advice: "Thực hành bốn tâm vô lượng: Từ, Bi, Hỷ, Xả trong từng hành động nhỏ."
    }
];

window.drawFortune = function() {
    const idx = Math.floor(Math.random() * FORTUNE_POEMS.length);
    return FORTUNE_POEMS[idx];
};
