import 'package:flutter/material.dart';
import 'package:soft/services/api_service.dart';

class NetworkGate extends StatefulWidget {
  final Widget child;
  const NetworkGate({super.key, required this.child});

  @override
  State<NetworkGate> createState() => _NetworkGateState();
}

class _NetworkGateState extends State<NetworkGate> {
  int _rev = 0; // đổi key để remount màn hiện tại

  void _reloadCurrentScreen() {
    // 1) tắt overlay lỗi
    ApiService.networkFailure.value = null;
    // 2) remount lại subtree hiện tại => initState() của màn con chạy lại
    setState(() => _rev++);
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: ApiService.networkFailure,
      builder: (context, failure, _) {
        return Stack(
          children: [
            // Luôn render màn hiện tại; _rev đổi => remount (initState chạy lại)
            KeyedSubtree(
              key: ValueKey(_rev),
              child: widget.child,
            ),

            // Overlay lỗi (không phải route riêng)
            if (failure != null)
              Positioned.fill(
                child: Material(
                  color: Colors.black45,
                  child: Center(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.wifi_off,
                                size: 48),
                            const SizedBox(height: 12),
                            Text(
                              failure.message,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            FilledButton.icon(
                              // KHÔNG điều hướng, KHÔNG ping; chỉ làm mới màn hiện tại
                              onPressed:
                                  _reloadCurrentScreen,
                              icon:
                                  const Icon(Icons.refresh),
                              label: const Text('Thử lại'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
