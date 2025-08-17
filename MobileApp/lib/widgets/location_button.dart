import 'package:flutter/material.dart';
import 'package:soft/models/location_model.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/routes/task_assignment_route.dart';
import 'package:soft/services/location_service.dart';

class LocationButton extends StatefulWidget {
  final String? location;
  final Function(String) onSelectLocation;
  const LocationButton({
    super.key,
    this.location,
    required this.onSelectLocation,
  });

  @override
  State<StatefulWidget> createState() => _LocationButton();
}

class _LocationButton extends State<LocationButton> {
  LocationModel? _location;

  final LocationService _locationService =
      LocationService();

  @override
  void initState() {
    super.initState();
    if (widget.location != null) {
      getLocation();
    } // Gán giá trị phương tiện ban đầu
  }

  void getLocation() async {
    var result = await _locationService.getById(
      widget.location!,
    );
    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      var data = result['data'];
      setState(() {
        _location = LocationModel.fromJson(data);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: TextButton.icon(
        icon: Icon(Icons.pin),
        onPressed: () async {
          final selectedLocation = await Navigator.of(
            context,
            rootNavigator: true,
          ).pushNamed(AppRoute.locationSelect);
          // Nếu có giá trị trả về, cập nhật phương tiện
          if (selectedLocation != null &&
              selectedLocation is LocationModel) {
            widget.onSelectLocation(selectedLocation.id);
            setState(() {
              _location =
                  selectedLocation; // Cập nhật giá trị phương tiện
            });
          }
        },
        style: TextButton.styleFrom(
          foregroundColor: Colors.black,
          backgroundColor: Colors.grey.shade300,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(0),
          ),
          alignment: Alignment.centerLeft,
        ),
        label: Text(_location?.name ?? 'Điểm đổ tải'),
      ),
    );
  }
}
