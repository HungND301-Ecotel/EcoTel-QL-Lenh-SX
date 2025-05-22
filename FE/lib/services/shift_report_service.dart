import 'package:soft/services/api_service.dart';

class ShiftReportService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> createShiftReport(
    Map<String, dynamic> data,
  ) async {
    return await _apiService.post('/shiftreport/create', data);
  }
  Future<Map<String, dynamic>> getByOrder(
    String id,
  ) async {
    return await _apiService.get('/shiftreport/getByOrder/$id');
  }
}
