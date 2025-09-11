import 'package:intl/intl.dart';

String generateBatchId(String? fullName) {
  // Lấy thời gian hiện tại
  final now = DateTime.now();

  // Định dạng ngày giờ theo yêu cầu
  final formattedDate = DateFormat(
    'yyyy-MM-dd HH:mm',
  ).format(now);

  // Kết hợp ngày giờ và tên người dùng để tạo batchId
  final batchId = '${formattedDate}_$fullName';

  return batchId;
}
