const SS_ID = "1FJbkPI2HrfaMII0ct3y0F8mhCgjwdiPEFA01FPVXFE4";
const SHEET_QUESTIONS_ID = 0;          // Sheet bài học, câu hỏi
const SHEET_LESSONS_ID = 517711267;     // Sheet danh mục bài học mới bổ sung

function doGet(e) {
    try {
        const correctPassword = PropertiesService.getScriptProperties().getProperty("APP_PASSWORD");
        const password = e && e.parameter && e.parameter.password;
        
        if (!correctPassword || !password || password !== correctPassword) {
            return ContentService.createTextOutput(JSON.stringify({
                status: "error",
                message: "Mật khẩu không chính xác hoặc chưa được thiết lập trên máy chủ.",
                data: null
            })).setMimeType(ContentService.MimeType.JSON);
        }

        const ss = SpreadsheetApp.openById(SS_ID);
        const sheets = ss.getSheets();

        // 1. Tìm các đối tượng sheet dựa theo ID cấu hình
        const sheetQuestions = sheets.find(s => s.getSheetId() === SHEET_QUESTIONS_ID);
        const sheetLessons = sheets.find(s => s.getSheetId() === SHEET_LESSONS_ID);

        if (!sheetQuestions) throw new Error("Không tìm thấy Sheet câu hỏi (ID: " + SHEET_QUESTIONS_ID + ")");
        if (!sheetLessons) throw new Error("Không tìm thấy Sheet danh mục bài học (ID: " + SHEET_LESSONS_ID + ")");

        // 2. Xử lý dữ liệu từ Sheet Câu hỏi (ID: 0)
        const dataQuestions = sheetQuestions.getDataRange().getValues();
        const recordsQuestions = dataQuestions.slice(1).map(row => ({
            lessonid: row[0],
            question: row[1],
            answer: row[2]
        })).filter(item => item.question || item.lessonid);

        // 3. Xử lý dữ liệu từ Sheet Danh mục bài học (ID: 517711267)
        const dataLessons = sheetLessons.getDataRange().getValues();
        const recordsLessons = dataLessons.slice(1).map(row => ({
            lesson_id: row[0],
            lesson_name: row[1]
        })).filter(item => item.lesson_id || item.lesson_name);

        // 4. Đồng bộ cấu trúc trả về gồm cả 2 mảng dữ liệu phân tách rõ ràng
        const successResponse = {
            status: "success",
            message: "Success",
            data: {
                questions: recordsQuestions,
                lessons: recordsLessons
            }
        };

        return ContentService.createTextOutput(JSON.stringify(successResponse))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (e) {
        const errorResponse = {
            status: "error",
            message: e.toString(),
            data: null
        };
        return ContentService.createTextOutput(JSON.stringify(errorResponse))
            .setMimeType(ContentService.MimeType.JSON);
    }
}