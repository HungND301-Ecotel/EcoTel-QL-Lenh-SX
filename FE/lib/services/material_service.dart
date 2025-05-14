import 'package:job_manager/services/api_service.dart';

class MaterialService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> getAllMaterial() async {
    return await _apiService.get('/material/getAll');
  }
}
