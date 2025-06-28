import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
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

  Future<Map<String, dynamic>> checkin({
    required String lat,
    required String lng,
    required String orderId,
    required XFile file,
  }) async {
    final formData = FormData.fromMap({
      'lat': lat,
      'lng': lng,
      'orderId': orderId,
      'file': await MultipartFile.fromFile(
        file.path,
        filename: file.name,
      ), // dùng file.name nếu bạn có
    });
    print("FormData lat: $lat");
    print("FormData lng: $lng");
    print("FormData orderId: $orderId");
    print("FormData file path: ${file.path}");
    return await _apiService.post(
      '/orders/checkin',
      formData,
      options: Options(
        headers: {"Content-Type": "multipart/form-data"},
      ),
    );
  }
}
