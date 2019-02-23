# Transmission Queue: Order by Seeds

This little script intends to order your Transmission queue by the number of seeds the torrent has, so more popular torrents are downloaded first.

## WARNING

This script will announce to **every single tracker** your Transmission is connected to in order to get peer lists. You may receive unwanted traffic, and your IP will be visible (just like when torrenting). It is advised to use this behind a VPN.

## TODO

- ~~Read torrent and get peer list from tracker announce~~
- IP hiding when searching for peers
- ~~DHT peer search~~
- ~~Get torrent/tracker list from Transmission~~
- ~~UDP tracker support~~ << Kind of. Currently unable to get a real peer list, so uniques aren't correctly calculated. If anybody can tell me why my announce isn't working, that would be great
- Handling mass-search without crashing
- Transmission queue management
- Disable DHT for private trackers
- Proper logging

## How to use

Currently, this project is too early in its development to be used.