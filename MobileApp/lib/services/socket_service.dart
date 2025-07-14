import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:socket_io_client/socket_io_client.dart'
    as IO;

class SocketService {
  static final SocketService _instance =
      SocketService._internal();

  factory SocketService() => _instance;

  late IO.Socket _socket;
  final ValueNotifier<dynamic> notificationNotifier =
      ValueNotifier(null); // thông báo mới

  bool get isConnected => _socket.connected;

  SocketService._internal() {
    _socket = IO.io(
      dotenv.env['SOCKET_API'] ??
          'ws://192.168.100.248:8080',
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    );
  }

  void connect(String userId) {
    if (!_socket.connected) {
      _socket.connect();
    }

    _socket.onConnect((_) {
      print('✅ Connected to server');
      _socket.emit('join_room', userId);

      // Gắn listener duy nhất
      _socket.off('notification');
      _socket.on('notification', (data) {
        print('📩 Notification: $data');
        notificationNotifier.value =
            data; // đẩy giá trị mới
      });
    });

    _socket.onDisconnect(
      (_) => print('🔴 Disconnected from server'),
    );
  }

  void disconnect() {
    _socket.disconnect();
  }
}
