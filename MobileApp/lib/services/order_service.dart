
import 'package:soft/services/api_service.dart';

class OrderService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> createOrder(
    Map<String, dynamic> data,
  ) async {
    return await _apiService.post('/orders', data);
  }

  Future<Map<String, dynamic>> getAllOrder() async {
    return await _apiService.get('/orders');
  }

  Future<Map<String, dynamic>> delete(String id) async {
    return await _apiService.delete('/orders/$id');
  }

  Future<Map<String, dynamic>> update(
    String id,
    Map<String, dynamic> data,
  ) async {
    return await _apiService.put('/orders/$id', data);
  }

  Future<Map<String, dynamic>> getByUser() async {
    return await _apiService.get('/orders/user');
  }

  Future<Map<String, dynamic>> getbyId(String id) async {
    return await _apiService.get('/orders/$id');
  }

  Future<Map<String, dynamic>> scanWork(
    Map<String, dynamic> data,
  ) async {
    return await _apiService.post('/orders/scanWork', data);
  }

  Future<Map<String, dynamic>> checkin(
    Map<String, dynamic> data,
  ) async {
    return await _apiService.post('/orders/checkin', data);
  }
}
