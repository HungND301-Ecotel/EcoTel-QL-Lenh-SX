import 'package:soft/services/api_service.dart';

class ReportService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> createReport(
    Map<String, dynamic> data,
  ) async {
    return await _apiService.post('/report/create', data);
  }
  Future<Map<String, dynamic>> getByOrder(
    String id,
  ) async {
    return await _apiService.get('/report/getByOrder/$id');
  }
}
