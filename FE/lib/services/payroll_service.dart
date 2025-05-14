import 'package:job_manager/services/api_service.dart';

class PayrollService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> getUserByCode(
    String code,
  ) async {
    return await _apiService.get(
      '/payroll/getByCode/$code',
    );
  }
}
