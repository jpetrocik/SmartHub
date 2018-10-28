# SmartHub
Center hub for control home automation.  Using a module system to provide automation and bridge disparent products. The following modeuls are currently supported:

X10Bridge:  A module that bridges X10 devices to an mqtt based control.

SunsetSunrise: A modules that tracks sunset and sunrise and publishes events when those times occurs.  Other modules can listen to those events are take action.

Scheduler:  A module to allow scheduling of mqtt messages to control devices. Supports cron syntax and event base like sunrise and sunset.

PseudoDevices:  A module to create pseudo devices.  The pseudo devices are a configuration of devices for specific modes.  Allows for setting up a device call "Movie" lights, which turns off main room lights and turns on accent lights.

Notifications:  Sends notificaiton when certain events happen.  When the garage door is opened a notifcation is sent that the garage door was opens.
