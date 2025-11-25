export interface Channel {
  id: string;
  number: number;
  name: string;
  url: string;
  category: string;
}

export const categories = [
  'All',
  'Local',
  'News',
  'Sports',
  'Entertainment',
  'Movies',
  'Music',
  'Kids',
  'Documentary',
  'Horror',
  'Comedy'
] as const;

export type Category = typeof categories[number];

// Original channels from your M3U (162 channels)
export const originalChannels: Channel[] = [
  { id: "abc-25", number: 1, name: "ABC 25 Columbia", url: "https://fl1.moveonjoy.com/ABC_EAST/index.m3u8", category: "Local" },
  { id: "accn", number: 2, name: "ACCN (720p)", url: "https://fl1.moveonjoy.com/ACC_NETWORK/index.m3u8", category: "Sports" },
  { id: "amc", number: 3, name: "AMC East (1080p)", url: "https://fl1.moveonjoy.com/AMC_NETWORK/index.m3u8", category: "Entertainment" },
  { id: "antenna-tv", number: 4, name: "Antenna TV", url: "https://fl1.moveonjoy.com/Antenna_TV/index.m3u8", category: "Entertainment" },
  { id: "aspire", number: 5, name: "Aspire", url: "https://fl1.moveonjoy.com/Aspire/index.m3u8", category: "Entertainment" },
  { id: "axs-tv", number: 6, name: "AXS TV", url: "https://fl1.moveonjoy.com/Axs_TV/index.m3u8", category: "Entertainment" },
  { id: "bbc-america", number: 7, name: "BBC America East", url: "https://fl1.moveonjoy.com/BBC_AMERICA/index.m3u8", category: "Entertainment" },
  { id: "bbc-news", number: 8, name: "BBC News North America", url: "https://fl1.moveonjoy.com/BBC_WORLD_NEWS/index.m3u8", category: "News" },
  { id: "bein-sports", number: 9, name: "beIN Sports USA", url: "http://fl1.moveonjoy.com/BEIN_SPORTS/index.m3u8", category: "Sports" },
  { id: "bet-east", number: 10, name: "BET East", url: "https://fl1.moveonjoy.com/BET_EAST/index.m3u8", category: "Entertainment" },
  { id: "bet-gospel", number: 11, name: "BET Gospel", url: "https://fl1.moveonjoy.com/BET_GOSPEL/index.m3u8", category: "Entertainment" },
  { id: "bet-her", number: 12, name: "BET Her East", url: "https://fl1.moveonjoy.com/BET_HER/index.m3u8", category: "Entertainment" },
  { id: "bet-jams", number: 13, name: "BET Jams", url: "https://fl1.moveonjoy.com/BET_Jams/index.m3u8", category: "Music" },
  { id: "bet-soul", number: 14, name: "BET Soul", url: "https://fl1.moveonjoy.com/BET_SOUL/index.m3u8", category: "Music" },
  { id: "big-ten", number: 15, name: "Big Ten Network", url: "https://fl1.moveonjoy.com/BIG_TEN_NETWORK/index.m3u8", category: "Sports" },
  { id: "bloomberg", number: 16, name: "Bloomberg TV", url: "https://fl1.moveonjoy.com/BLOOMBERG/index.m3u8", category: "News" },
  { id: "bounce", number: 17, name: "Bounce", url: "https://fl1.moveonjoy.com/BOUNCE_TV/index.m3u8", category: "Entertainment" },
  { id: "bravo", number: 18, name: "Bravo East", url: "https://fl1.moveonjoy.com/BRAVO/index.m3u8", category: "Entertainment" },
  { id: "buzzr", number: 19, name: "Buzzr", url: "https://fl1.moveonjoy.com/Buzzr/index.m3u8", category: "Entertainment" },
  { id: "cspan", number: 20, name: "C-SPAN", url: "https://fl1.moveonjoy.com/C-SPAN/index.m3u8", category: "News" },
  { id: "cbs-east", number: 21, name: "CBS East (720p)", url: "https://fl1.moveonjoy.com/CBS_News/index.m3u8", category: "Local" },
  { id: "cbs-sports", number: 22, name: "CBS Sports Network USA", url: "https://fl1.moveonjoy.com/CBS_SPORTS_NETWORK/index.m3u8", category: "Sports" },
  { id: "chbl-tv", number: 23, name: "CHBL-TV", url: "https://fl1.moveonjoy.com/CA_GLOBAL/index.m3u8", category: "Entertainment" },
  { id: "cleo-tv", number: 24, name: "Cleo TV (720p)", url: "https://fl1.moveonjoy.com/Cleo_TV/index.m3u8", category: "Entertainment" },
  { id: "cmt", number: 25, name: "CMT East", url: "https://fl1.moveonjoy.com/CMT/index.m3u8", category: "Music" },
  { id: "cnbc", number: 26, name: "CNBC", url: "https://fl1.moveonjoy.com/CNBC/index.m3u8", category: "News" },
  { id: "cnbc-world", number: 27, name: "CNBC World", url: "https://fl1.moveonjoy.com/CNBC_World/index.m3u8", category: "News" },
  { id: "comedy-tv", number: 28, name: "Comedy TV", url: "https://fl1.moveonjoy.com/Comedy_TV/index.m3u8", category: "Comedy" },
  { id: "comet", number: 29, name: "Comet", url: "https://fl1.moveonjoy.com/COMET/index.m3u8", category: "Entertainment" },
  { id: "court-tv", number: 30, name: "Court TV", url: "https://fl1.moveonjoy.com/COURT_TV/index.m3u8", category: "News" },
  { id: "cozi-tv", number: 31, name: "Cozi TV", url: "https://fl1.moveonjoy.com/COZI_TV/index.m3u8", category: "Entertainment" },
  { id: "crave-1", number: 32, name: "Crave 1", url: "https://fl1.moveonjoy.com/CRAVE_1/index.m3u8", category: "Movies" },
  { id: "crave-2", number: 33, name: "Crave 2", url: "https://fl1.moveonjoy.com/CRAVE_2/index.m3u8", category: "Movies" },
  { id: "crave-3", number: 34, name: "Crave 3", url: "https://fl1.moveonjoy.com/CRAVE_3/index.m3u8", category: "Movies" },
  { id: "crave-4", number: 35, name: "Crave 4", url: "https://fl1.moveonjoy.com/CRAVE_4/index.m3u8", category: "Movies" },
  { id: "crime-investigation", number: 36, name: "Crime + Investigation", url: "https://fl1.moveonjoy.com/Crime_and_Investigation_Network/index.m3u8", category: "Documentary" },
  { id: "curiosity-stream", number: 37, name: "CuriosityStream (720p)", url: "https://fl1.moveonjoy.com/Curiosity_Stream/index.m3u8", category: "Documentary" },
  { id: "cvm-tv", number: 38, name: "CVM TV", url: "https://fl1.moveonjoy.com/CVM_TV_CARIBBEAN/index.m3u8", category: "Entertainment" },
  { id: "disney", number: 39, name: "Disney Channel East", url: "https://fl1.moveonjoy.com/DISNEY/index.m3u8", category: "Kids" },
  { id: "disney-jr", number: 40, name: "Disney Junior East", url: "https://fl1.moveonjoy.com/DISNEY_JR/index.m3u8", category: "Kids" },
  { id: "disney-xd", number: 41, name: "Disney XD (720p)", url: "http://fl1.moveonjoy.com/DISNEY_XD/index.m3u8", category: "Kids" },
  { id: "e-entertainment", number: 42, name: "E! East", url: "https://fl1.moveonjoy.com/E_ENTERTAINMENT_TELEVISION/index.m3u8", category: "Entertainment" },
  { id: "espn-u", number: 43, name: "ESPN U (720p)", url: "https://fl1.moveonjoy.com/ESPN_U/index.m3u8", category: "Sports" },
  { id: "espn-news", number: 44, name: "ESPNews (720p)", url: "https://fl1.moveonjoy.com/ESPN_NEWS/index.m3u8", category: "Sports" },
  { id: "fanduel-sports", number: 45, name: "FanDuel Sports Network", url: "https://fl1.moveonjoy.com/PAC_12/index.m3u8", category: "Sports" },
  { id: "fanduel-tv", number: 46, name: "FanDuel TV", url: "https://fl1.moveonjoy.com/TVG/index.m3u8", category: "Sports" },
  { id: "fox-business", number: 47, name: "Fox Business Network (720p)", url: "https://fl1.moveonjoy.com/FOX_Business_Network/index.m3u8", category: "News" },
  { id: "fox-news", number: 48, name: "Fox News Channel (720p)", url: "https://fl1.moveonjoy.com/FOX_NEWS_CHANNEL/index.m3u8", category: "News" },
  { id: "fox-soul", number: 49, name: "Fox Soul", url: "https://fl1.moveonjoy.com/FOX_SOUL/index.m3u8", category: "Entertainment" },
  { id: "fox-sports-1", number: 50, name: "Fox Sports 1", url: "https://fl1.moveonjoy.com/FOX_Sports_1/index.m3u8", category: "Sports" },
  { id: "freeform", number: 51, name: "Freeform East", url: "https://fl1.moveonjoy.com/FREE_FORM/index.m3u8", category: "Entertainment" },
  { id: "fuse", number: 52, name: "Fuse East (720p)", url: "https://fl1.moveonjoy.com/FUSE/index.m3u8", category: "Music" },
  { id: "fx", number: 53, name: "FX East", url: "https://fl1.moveonjoy.com/FX/index.m3u8", category: "Entertainment" },
  { id: "fxm", number: 54, name: "FXM East", url: "https://fl1.moveonjoy.com/FX_MOVIE/index.m3u8", category: "Movies" },
  { id: "fxx", number: 55, name: "FXX East", url: "https://fl1.moveonjoy.com/FXX/index.m3u8", category: "Entertainment" },
  { id: "fyi", number: 56, name: "FYI East", url: "https://fl1.moveonjoy.com/FYI/index.m3u8", category: "Entertainment" },
  { id: "get-tv", number: 57, name: "GetTV (480p)", url: "https://fl1.moveonjoy.com/GET_TV/index.m3u8", category: "Entertainment" },
  { id: "golf", number: 58, name: "Golf Channel", url: "https://fl1.moveonjoy.com/GOLF/index.m3u8", category: "Sports" },
  { id: "hallmark", number: 59, name: "Hallmark Channel East (720p)", url: "https://fl1.moveonjoy.com/HALLMARK_CHANNEL/index.m3u8", category: "Entertainment" },
  { id: "hallmark-drama", number: 60, name: "Hallmark Drama (720p)", url: "https://fl1.moveonjoy.com/HALLMARK_DRAMA/index.m3u8", category: "Entertainment" },
  { id: "hallmark-movies", number: 61, name: "Hallmark Movies Mysteries East", url: "https://fl1.moveonjoy.com/HALLMARK_MOVIES_MYSTERIES/index.m3u8", category: "Entertainment" },
  { id: "history", number: 62, name: "History", url: "https://fl1.moveonjoy.com/history_channel/index.m3u8", category: "Documentary" },
  { id: "hsn", number: 63, name: "HSN", url: "https://fl1.moveonjoy.com/HSN/index.m3u8", category: "Entertainment" },
  { id: "insp", number: 64, name: "INSP", url: "https://fl1.moveonjoy.com/INSP/index.m3u8", category: "Entertainment" },
  { id: "ion-plus", number: 65, name: "ION Plus East (720p)", url: "https://fl1.moveonjoy.com/ION_Plus/index.m3u8", category: "Entertainment" },
  { id: "ion-tv", number: 66, name: "ION TV East", url: "https://fl1.moveonjoy.com/ION_TV/index.m3u8", category: "Entertainment" },
  { id: "lifetime", number: 67, name: "Lifetime East", url: "https://fl1.moveonjoy.com/LIFETIME/index.m3u8", category: "Entertainment" },
  { id: "lifetime-movies", number: 68, name: "Lifetime Movies East", url: "https://fl1.moveonjoy.com/LIFETIME_MOVIE_NETWORK/index.m3u8", category: "Movies" },
  { id: "love-nature", number: 69, name: "Love Nature", url: "https://fl1.moveonjoy.com/LOVE_NATURE/index.m3u8", category: "Documentary" },
  { id: "mav-tv", number: 70, name: "MAV TV (720p)", url: "https://fl1.moveonjoy.com/MAV_TV/index.m3u8", category: "Sports" },
  { id: "me-tv", number: 71, name: "MeTV", url: "https://fl1.moveonjoy.com/ME_TV/index.m3u8", category: "Entertainment" },
  { id: "mgm-plus", number: 72, name: "MGM+ East", url: "https://fl1.moveonjoy.com/EPIX/index.m3u8", category: "Movies" },
  { id: "mgm-marquee", number: 73, name: "MGM+ Marquee", url: "https://fl1.moveonjoy.com/EPIX_DRIVE_IN/index.m3u8", category: "Movies" },
  { id: "military-history", number: 74, name: "Military History", url: "https://fl1.moveonjoy.com/Military_History/index.m3u8", category: "Documentary" },
  { id: "mlb-network", number: 75, name: "MLB Network", url: "https://fl1.moveonjoy.com/MLB_NETWORK/index.m3u8", category: "Sports" },
  { id: "msg", number: 76, name: "MSG", url: "https://fl1.moveonjoy.com/MSG/index.m3u8", category: "Sports" },
  { id: "mtv2", number: 77, name: "MTV2 (720p)", url: "https://fl1.moveonjoy.com/MTV_2/index.m3u8", category: "Music" },
  { id: "mtv-classic", number: 78, name: "MTV Classic (360p)", url: "https://fl1.moveonjoy.com/MTV_CLASSIC/index.m3u8", category: "Music" },
  { id: "mtv", number: 79, name: "MTV East", url: "https://fl1.moveonjoy.com/MTV/index.m3u8", category: "Music" },
  { id: "mtv-live", number: 80, name: "MTV Live (720p)", url: "https://fl1.moveonjoy.com/MTV_LIVE/index.m3u8", category: "Music" },
  { id: "mtvu", number: 81, name: "mtvU (480p)", url: "https://fl1.moveonjoy.com/MTV_U/index.m3u8", category: "Music" },
  { id: "much", number: 82, name: "Much (720p)", url: "https://fl1.moveonjoy.com/MUCH/index.m3u8", category: "Music" },
  { id: "nat-geo", number: 83, name: "National Geographic East", url: "https://fl1.moveonjoy.com/National_Geographic/index.m3u8", category: "Documentary" },
  { id: "nat-geo-wild", number: 84, name: "National Geographic Wild East", url: "https://fl1.moveonjoy.com/Nat_Geo_Wild/index.m3u8", category: "Documentary" },
  { id: "nba-tv", number: 85, name: "NBA TV", url: "https://fl1.moveonjoy.com/NBA_TV/index.m3u8", category: "Sports" },
  { id: "news-nation", number: 86, name: "News Nation (720p)", url: "https://fl1.moveonjoy.com/NEWS_NATION/index.m3u8", category: "News" },
  { id: "nfl-network", number: 87, name: "NFL Network", url: "https://fl1.moveonjoy.com/NFL_NETWORK/index.m3u8", category: "Sports" },
  { id: "nfl-redzone", number: 88, name: "NFL RedZone", url: "https://fl1.moveonjoy.com/NFL_RedZone/index.m3u8", category: "Sports" },
  { id: "nhl-network", number: 89, name: "NHL Network (720p)", url: "https://fl1.moveonjoy.com/NHL_NETWORK/index.m3u8", category: "Sports" },
  { id: "nick-jr", number: 90, name: "Nick Jr. East (720p)", url: "https://fl1.moveonjoy.com/NICK_JR/index.m3u8", category: "Kids" },
  { id: "nick-music", number: 91, name: "Nick Music (720p)", url: "https://fl1.moveonjoy.com/NICK_MUSIC/index.m3u8", category: "Music" },
  { id: "nick", number: 92, name: "Nickelodeon East", url: "https://fl1.moveonjoy.com/NICKELODEON/index.m3u8", category: "Kids" },
  { id: "nicktoons", number: 93, name: "Nicktoons East", url: "https://fl1.moveonjoy.com/NICKTOONS/index.m3u8", category: "Kids" },
  { id: "outdoor", number: 94, name: "Outdoor Channel", url: "https://fl1.moveonjoy.com/OUTDOOR_CHANNEL/index.m3u8", category: "Sports" },
  { id: "outermax", number: 95, name: "OuterMax East (720p)", url: "https://fl1.moveonjoy.com/OUTER_MAX/index.m3u8", category: "Movies" },
  { id: "outside-tv", number: 96, name: "Outside TV", url: "https://fl1.moveonjoy.com/OUTSIDE_TV/index.m3u8", category: "Sports" },
  { id: "ovation", number: 97, name: "Ovation (1080p)", url: "https://fl1.moveonjoy.com/Ovation/index.m3u8", category: "Entertainment" },
  { id: "oxygen", number: 98, name: "Oxygen East", url: "https://fl1.moveonjoy.com/OXYGEN/index.m3u8", category: "Entertainment" },
  { id: "paramount", number: 99, name: "Paramount Network East", url: "https://fl1.moveonjoy.com/PARAMOUNT_NETWORK/index.m3u8", category: "Entertainment" },
  { id: "pop-tv", number: 100, name: "Pop TV", url: "https://fl1.moveonjoy.com/Pop_TV/index.m3u8", category: "Entertainment" },
  { id: "pursuit", number: 101, name: "Pursuit Channel (720p)", url: "https://fl1.moveonjoy.com/Pursuit_Channel/index.m3u8", category: "Sports" },
  { id: "qvc", number: 102, name: "QVC (720p)", url: "https://fl1.moveonjoy.com/QVC/index.m3u8", category: "Entertainment" },
  { id: "reelz", number: 103, name: "Reelz (720p)", url: "https://fl1.moveonjoy.com/REELZ/index.m3u8", category: "Entertainment" },
  { id: "revolt", number: 104, name: "Revolt", url: "https://fl1.moveonjoy.com/REVOLT/index.m3u8", category: "Music" },
  { id: "showtime-2", number: 105, name: "Showtime 2 East", url: "https://fl1.moveonjoy.com/SHOWTIME_2/index.m3u8", category: "Movies" },
  { id: "showtime", number: 106, name: "Showtime East", url: "https://fl1.moveonjoy.com/SHOWTIME/index.m3u8", category: "Movies" },
  { id: "showtime-next", number: 107, name: "Showtime Next East", url: "https://fl1.moveonjoy.com/SHOWTIME_NEXT/index.m3u8", category: "Movies" },
  { id: "showtime-west", number: 108, name: "Showtime West (1080p)", url: "https://fl1.moveonjoy.com/SHOWTIME_WEST/index.m3u8", category: "Movies" },
  { id: "showtime-women", number: 109, name: "Showtime Women East", url: "https://fl1.moveonjoy.com/SHOWTIME_WOMEN/index.m3u8", category: "Movies" },
  { id: "smithsonian", number: 110, name: "Smithsonian Channel East", url: "https://fl1.moveonjoy.com/SMITHSONIAN_CHANNEL/index.m3u8", category: "Documentary" },
  { id: "sony", number: 111, name: "Sony Channel", url: "https://fl1.moveonjoy.com/Sony_Movie_Channel/index.m3u8", category: "Movies" },
  { id: "sportsman", number: 112, name: "Sportsman Channel", url: "https://fl1.moveonjoy.com/SPORTSMAN_CHANNEL/index.m3u8", category: "Sports" },
  { id: "sny", number: 113, name: "SportsNet New York (540p)", url: "https://fl1.moveonjoy.com/SNY/index.m3u8", category: "Sports" },
  { id: "start-tv", number: 114, name: "Start TV", url: "https://fl1.moveonjoy.com/Start_Tv/index.m3u8", category: "Entertainment" },
  { id: "starz", number: 115, name: "Starz East", url: "https://fl1.moveonjoy.com/STARZ/index.m3u8", category: "Movies" },
  { id: "starz-encore", number: 116, name: "Starz Encore Classic East", url: "https://fl1.moveonjoy.com/STARZ_ENCORE_CLASSIC/index.m3u8", category: "Movies" },
  { id: "starz-west", number: 117, name: "Starz West", url: "https://fl1.moveonjoy.com/STARZ_WEST/index.m3u8", category: "Movies" },
  { id: "stories-amc", number: 118, name: "Stories by AMC (1080p)", url: "http://fl1.moveonjoy.com/AMC_NETWORK/index.m3u8", category: "Entertainment" },
  { id: "sundance", number: 119, name: "Sundance TV East", url: "https://fl1.moveonjoy.com/SUNDANCE/index.m3u8", category: "Movies" },
  { id: "syfy", number: 120, name: "Syfy East", url: "https://fl1.moveonjoy.com/SYFY/index.m3u8", category: "Entertainment" },
  { id: "teennick", number: 121, name: "TeenNick", url: "https://fl1.moveonjoy.com/Teen_Nick/index.m3u8", category: "Kids" },
  { id: "tennis", number: 122, name: "Tennis Channel", url: "https://fl1.moveonjoy.com/TENNIS_CHANNEL/index.m3u8", category: "Sports" },
  { id: "cowboy", number: 123, name: "The Cowboy Channel", url: "https://fl1.moveonjoy.com/Cowboy_Channel/index.m3u8", category: "Entertainment" },
  { id: "tsn1", number: 124, name: "TSN1 (1080p)", url: "https://fl1.moveonjoy.com/TSN_1/index.m3u8", category: "Sports" },
  { id: "tsn2", number: 125, name: "TSN2", url: "https://fl1.moveonjoy.com/TSN_2/index.m3u8", category: "Sports" },
  { id: "tsn3", number: 126, name: "TSN3", url: "https://fl1.moveonjoy.com/TSN_3/index.m3u8", category: "Sports" },
  { id: "tsn4", number: 127, name: "TSN4", url: "https://fl1.moveonjoy.com/TSN_4/index.m3u8", category: "Sports" },
  { id: "tsn5", number: 128, name: "TSN5", url: "https://fl1.moveonjoy.com/TSN_5/index.m3u8", category: "Sports" },
  { id: "tv-land", number: 129, name: "TV Land", url: "https://fl1.moveonjoy.com/TV_LAND/index.m3u8", category: "Entertainment" },
  { id: "tv-one", number: 130, name: "TV One", url: "https://fl1.moveonjoy.com/TV_ONE/index.m3u8", category: "Entertainment" },
  { id: "usa-network", number: 131, name: "USA Network (720p)", url: "http://fl1.moveonjoy.com/USA_NETWORK/index.m3u8", category: "Entertainment" },
  { id: "vh1", number: 132, name: "VH1 East", url: "https://fl1.moveonjoy.com/VH1/index.m3u8", category: "Music" },
  { id: "vice", number: 133, name: "VICE TV (720p)", url: "https://fl1.moveonjoy.com/VICELAND/index.m3u8", category: "Entertainment" },
  { id: "w-network", number: 134, name: "W Network (720p)", url: "https://fl1.moveonjoy.com/W_NETWORK/index.m3u8", category: "Entertainment" },
  { id: "we-tv", number: 135, name: "We TV East", url: "https://fl1.moveonjoy.com/WE_TV/index.m3u8", category: "Entertainment" },
  { id: "wfla", number: 136, name: "WFLA-DT1", url: "https://fl1.moveonjoy.com/FL_Tampa_NBC/index.m3u8", category: "Local" },
  { id: "wflx", number: 137, name: "WFLX-DT1", url: "https://fl1.moveonjoy.com/FL_West_Palm_Beach_FOX/index.m3u8", category: "Local" },
  { id: "wfts", number: 138, name: "WFTS-DT1", url: "https://fl1.moveonjoy.com/FL_Tampa_ABC/index.m3u8", category: "Local" },
  { id: "wgn", number: 139, name: "WGN-DT1 (720p)", url: "https://fl1.moveonjoy.com/WGN/index.m3u8", category: "Local" },
  { id: "willow", number: 140, name: "Willow", url: "https://fl1.moveonjoy.com/WILLOW_CRICKET/index.m3u8", category: "Sports" },
  { id: "wkcf", number: 141, name: "WKCF-DT1", url: "https://fl1.moveonjoy.com/CW_ORLANDO/index.m3u8", category: "Local" },
  { id: "wofl", number: 142, name: "WOFL-DT1 (720p)", url: "https://fl1.moveonjoy.com/FOX_EAST/index.m3u8", category: "Local" },
  { id: "world-fishing", number: 143, name: "World Fishing Network", url: "https://fl1.moveonjoy.com/WORLD_FISHING_NETWORK/index.m3u8", category: "Sports" },
  { id: "wpec", number: 144, name: "WPEC-DT1", url: "https://fl1.moveonjoy.com/FL_West_Palm_Beach_CBS/index.m3u8", category: "Local" },
  { id: "wtog", number: 145, name: "WTOG-DT1", url: "https://fl1.moveonjoy.com/FL_Tampa_CW44/index.m3u8", category: "Local" },
  { id: "wvgn", number: 146, name: "WVGN-LD1", url: "https://fl1.moveonjoy.com/Virgin_Islands_NBC/index.m3u8", category: "Local" },
  { id: "yes-network", number: 147, name: "Yes Network", url: "https://fl1.moveonjoy.com/YES_NETWORK/index.m3u8", category: "Sports" },
  { id: "pluto-sports-1", number: 148, name: "Pluto TV Sports 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5d7677fa2ec536ce1d587eeb/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Sports" },
  { id: "redbull-tv", number: 149, name: "Red Bull TV", url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8", category: "Sports" },
  { id: "fox-sports-news", number: 150, name: "Fox Sports News", url: "https://austchannel-live.akamaized.net/hls/live/2002736/austchannel-sport/master.m3u8", category: "Sports" },
  { id: "stadium", number: 151, name: "Stadium", url: "https://stadiumlivein-i.akamaihd.net/hls/live/522512/mux_4/master.m3u8", category: "Sports" },
  { id: "swiss-sport", number: 152, name: "Swiss Sport TV", url: "https://cdn02.upstream-cloud.ch/sstvlinear/ngrp:sstvlinear_all/playlist.m3u8", category: "Sports" },
  { id: "fuel-tv", number: 153, name: "Fuel TV", url: "https://fueltv-fueltv-1-gb.samsung.wurl.com/manifest/playlist.m3u8", category: "Sports" },
  { id: "mav-tv-motorsports", number: 154, name: "Mav TV Motorsports", url: "https://mavtv-mavtvglobal-1-be.samsung.wurl.com/manifest/playlist.m3u8", category: "Sports" },
  { id: "pac12-mountain", number: 155, name: "Pac-12 Mountain", url: "http://pac12mountain-lh.akamaihd.net/i/mountain_delivery@428912/master.m3u8", category: "Sports" },
  { id: "pac12-la", number: 156, name: "Pac-12 Los Angeles", url: "http://pac12la-lh.akamaihd.net/i/la_delivery@425541/master.m3u8", category: "Sports" },
  { id: "acc-digital", number: 157, name: "ACC Digital Network", url: "https://120sports-accdn-1.plex.wurl.com/manifest/playlist.m3u8", category: "Sports" },
  { id: "sportsgrid", number: 158, name: "SportsGrid", url: "https://sportsgrid-klowdtv.amagi.tv/playlist.m3u8", category: "Sports" },
  { id: "edge-sport", number: 159, name: "Edge Sport", url: "https://edgesport-sportsedge-1.samsung.wurl.com/manifest/playlist.m3u8", category: "Sports" },
  { id: "horizon-sports", number: 160, name: "Horizon Sports", url: "https://horisonssport.cdn.vustreams.com/live/cd533d12-01f8-40c7-b0f4-5626b119f787/live.isml/playlist.m3u8", category: "Sports" },
  { id: "wpt", number: 161, name: "World Poker Tour", url: "https://wpt-wpt-samsung.amagi.tv/playlist.m3u8", category: "Sports" },
  { id: "pokergo", number: 162, name: "PokerGo Free", url: "https://pokergo-pokergo-1.samsung.wurl.com/manifest/playlist.m3u8", category: "Sports" },
];

// Horror & Thriller channels - Verified working streams from free IPTV sources
// Sources: iptv-org, Tubi, Pluto TV, and other free ad-supported services
export const horrorChannels: Channel[] = [
  // Tubi TV Horror Channels (Most Reliable)
  { id: "filmrise-horror", number: 200, name: "FilmRise Horror", url: "https://live-manifest.production-public.tubi.io/live/617d4f8d-bf47-41cf-9fe4-808763b07118/playlist.m3u8", category: "Horror" },
  { id: "alter-horror", number: 201, name: "Horror by ALTER", url: "https://live-manifest.production-public.tubi.io/live/c12f35bf-6465-4e44-b5f7-04ec645689c7/playlist.m3u8", category: "Horror" },
  { id: "ghosts-are-real", number: 202, name: "Ghosts are Real", url: "https://live-manifest.production-public.tubi.io/live/0893a942-6252-4604-9e43-147c920a3250/playlist.m3u8", category: "Horror" },
  { id: "haunt-tv", number: 203, name: "HauntTV", url: "https://live-manifest.production-public.tubi.io/live/e1314865-409b-4349-87b8-550453f4e468/playlist.m3u8", category: "Horror" },

  // Pluto TV Horror (Fixed URLs - Samsung TV Plus format)
  { id: "pluto-horror", number: 204, name: "Pluto TV Horror Movies", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/569546031a619b8f07ce6e25/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Horror" },
  { id: "pluto-terror", number: 205, name: "Pluto TV Terror Movies", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5c6dc88fcd232425a6e0f06e/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Horror" },
  { id: "pluto-thrillers-1", number: 206, name: "Pluto TV Thrillers 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5b4e69e08291147bd04a9fd7/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Horror" },
  { id: "pluto-thrillers-2", number: 207, name: "Pluto TV Thrillers 2", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5dbfedccc563080009b60f4a/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Horror" },
  { id: "pluto-crime-movies", number: 208, name: "Pluto TV Crime Movies", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5f4d8594eb979c0007706de7/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Horror" },
  { id: "pluto-paranormal-1", number: 209, name: "Pluto TV Paranormal 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5d4af2ffa9506ab29cf38c38/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Horror" },
  { id: "pluto-paranormal-2", number: 210, name: "Pluto TV Paranormal 2", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5adf96e3e738977e2c31cb04/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Horror" },
  { id: "pluto-suspense", number: 211, name: "Pluto TV Suspense", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5f15e281b0b8840007324b55/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Horror" },
  { id: "pluto-cult-films-1", number: 212, name: "Pluto TV Cult Films 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5c5c31f2f21b553c1f673fb0/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Horror" },
  { id: "pluto-cult-films-2", number: 213, name: "Pluto TV Cult Films 2", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5c665db3e6c01b72c4977bc2/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Horror" },

  // Bloody Disgusting (iptv-org verified)
  { id: "bloody-disgusting", number: 214, name: "Bloody Disgusting TV", url: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01201-cinedigmenterta-bloodydisgus-cineverse/playlist.m3u8", category: "Horror" },

  // Film Noir - Classic Suspense
  { id: "film-noir", number: 215, name: "TVS Film Noir Network", url: "https://rpn.bozztv.com/trn01/gusa-TVSFilmNoir/index.m3u8", category: "Horror" },

  // Pluto True Crime (Horror-adjacent)
  { id: "pluto-true-crime", number: 216, name: "Pluto TV True Crime", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5812be1c249444e05d09cc50/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Horror" },
  { id: "forensic-files", number: 217, name: "Forensic Files", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5bb1af6a268cae539bcedb0a/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Horror" },
];

// Pluto TV Channels - Working Samsung TV Plus format URLs
export const plutoChannels: Channel[] = [
  // Entertainment
  { id: "pluto-comedy-central", number: 300, name: "Comedy Central Pluto TV", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5ca671f215a62078d2ec0abf/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Comedy" },
  { id: "pluto-comedy-animation", number: 301, name: "Comedy Central Animation", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5f99e24636d67d0007a94e6d/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Comedy" },
  { id: "pluto-stand-up", number: 302, name: "Pluto TV Stand Up", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5d135e29a52c94dfe543c5d3/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Comedy" },
  { id: "pluto-failarmy", number: 303, name: "FailArmy", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5ad8d883e738977e2c31096b/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Comedy" },
  { id: "pluto-funny-af", number: 304, name: "Funny AF", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/580e87ff497c73ba2f321dd3/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Comedy" },

  // BET & MTV Networks
  { id: "pluto-bet-1", number: 305, name: "BET Pluto TV 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5ca670f6593a5d78f0e85aed/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-bet-2", number: 306, name: "BET Pluto TV 2", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/604f8f8622166000071a929f/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-bet-her", number: 307, name: "BET Her", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5d51e6949ab8e2b35bdcaa9f/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-mtv", number: 308, name: "MTV Pluto TV", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5ca672f515a62078d2ec0ad2/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-mtv-dating", number: 309, name: "MTV Dating", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5ca6899a37b88b269472ea4b/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-vh1-hiphop", number: 310, name: "VH1 Hip Hop Family", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5d71561df6f2e6d0b6493bf5/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-vh1-reality", number: 311, name: "VH1 I Love Reality", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5d7154fa8326b6ce4ec31f2e/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-cmt", number: 312, name: "CMT Pluto TV", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5dcc42446750e200093b15e2/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },

  // Classic TV & Drama
  { id: "pluto-classic-tv", number: 313, name: "Pluto TV Classic TV", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5d134a74ca91eedee1630faa/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-tv-land-drama", number: 314, name: "TV Land Drama", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5d40bebc5e3d2750a2239d7e/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-tv-land-sitcoms", number: 315, name: "TV Land Sitcoms", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5c2d64ffbdf11b71587184b8/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-game-shows", number: 316, name: "Pluto TV Game Shows", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/6036e7c385749f00075dbd3b/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-reality-1", number: 317, name: "Pluto TV Reality 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5bd8186d53ed2c6334ea0855/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-reality-2", number: 318, name: "Pluto TV Reality 2", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5d8bf0b06d2d855ee15115e3/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },

  // Movies
  { id: "pluto-movies", number: 319, name: "Pluto TV Movies", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5ad8d3a31b95267e225e4e09/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Movies" },
  { id: "pluto-action-1", number: 320, name: "Pluto TV Action Movies 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/561d7d484dc7c8770484914a/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Movies" },
  { id: "pluto-action-2", number: 321, name: "Pluto TV Action Movies 2", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5dbfeb961b411c00090b52b3/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Movies" },
  { id: "pluto-comedy-movies-1", number: 322, name: "Pluto TV Comedy Movies 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5a4d3a00ad95e4718ae8d8db/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Movies" },
  { id: "pluto-comedy-movies-2", number: 323, name: "Pluto TV Comedy Movies 2", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5c363c2411c5ca053f198f97/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Movies" },
  { id: "pluto-drama-movies-1", number: 324, name: "Pluto TV Drama Movies 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5b4e92e4694c027be6ecece1/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Movies" },
  { id: "pluto-drama-movies-2", number: 325, name: "Pluto TV Drama Movies 2", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5ddf91149880d60009d35d27/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Movies" },
  { id: "pluto-scifi-movies", number: 326, name: "Pluto TV Sci-Fi Movies", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5dc02a44a9518600094273ac/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Movies" },
  { id: "pluto-western-movies", number: 327, name: "Pluto TV Western Movies", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5b4e94282d4ec87bdcbb87cd/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Movies" },
  { id: "pluto-romance-1", number: 328, name: "Pluto TV Romance Movies 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5a66795ef91fef2c7031c599/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Movies" },
  { id: "pluto-family-movies", number: 329, name: "Pluto TV Family Movies", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5dc3fc6b9133f500099c7d98/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Movies" },
  { id: "pluto-70s-cinema", number: 330, name: "70s Cinema", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5f4d878d3d19b30007d2e782/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Movies" },
  { id: "pluto-80s-rewind", number: 331, name: "80s Rewind", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5ca525b650be2571e3943c63/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Movies" },
  { id: "pluto-90s-throwback", number: 332, name: "90s Throwback", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5f4d86f519358a00072b978e/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Movies" },
  { id: "pluto-black-cinema", number: 333, name: "Black Cinema", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/58af4c093a41ca9d4ecabe96/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Movies" },

  // Sci-Fi & Fantasy
  { id: "pluto-scifi", number: 334, name: "Pluto TV Sci-Fi", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5b4fc274694c027be6ed3eea/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-fantastic", number: 335, name: "Pluto TV Fantastic Movies", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5b64a245a202b3337f09e51d/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Movies" },

  // Sports
  { id: "pluto-sports-2", number: 336, name: "Pluto TV Sports 2", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/56340779a738201b4ccfeac9/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Sports" },
  { id: "pluto-fight-1", number: 337, name: "Pluto TV Fight 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5ad8d659fd87eb3a2717afc9/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Sports" },
  { id: "pluto-fight-2", number: 338, name: "Pluto TV Fight 2", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5812b0f2237a6ff45d16c3f9/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Sports" },
  { id: "pluto-boxing", number: 339, name: "Pluto TV Boxing", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5fac425f949b4600079938f3/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Sports" },
  { id: "pluto-wrestling", number: 340, name: "Pluto TV Pro Wrestling", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5fac431fc1ffbc0007e6b6a7/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Sports" },
  { id: "pluto-impact", number: 341, name: "IMPACT Wrestling", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/59b722526996084038c01e1b/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Sports" },

  // Documentaries
  { id: "pluto-docs-1", number: 342, name: "Pluto TV Documentaries 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5db04252241007000975faac/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Documentary" },
  { id: "pluto-docs-2", number: 343, name: "Pluto TV Documentaries 2", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5b85a7582921777994caea63/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Documentary" },
  { id: "pluto-history-1", number: 344, name: "Pluto TV History 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5d4af1803e7983b391d73b13/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Documentary" },
  { id: "pluto-history-2", number: 345, name: "Pluto TV History 2", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5a4d35dfa5c02e717a234f86/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Documentary" },
  { id: "pluto-nature", number: 346, name: "Pluto TV Nature", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5db050444f3c52000984c72a/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Documentary" },
  { id: "pluto-animals-1", number: 347, name: "Pluto TV Animals 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5ddf8ea0d000120009bcad83/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Documentary" },
  { id: "pluto-science-1", number: 348, name: "Pluto TV Science 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5d9492c77ea6f99188738ff1/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Documentary" },
  { id: "pluto-conspiracy", number: 349, name: "Pluto TV Conspiracy", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5d4ae94ef1a1bbb350ca41bb/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Documentary" },

  // Kids
  { id: "pluto-nick", number: 350, name: "Nick Pluto TV", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5ca673e0d0bd6c2689c94ce3/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Kids" },
  { id: "pluto-nick-jr", number: 351, name: "Nick Jr. Pluto TV", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5ca6748a37b88b269472dad9/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Kids" },
  { id: "pluto-kids-1", number: 352, name: "Pluto TV Kids 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5ad8d54be738977e2c310940/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Kids" },
  { id: "pluto-kids-2", number: 353, name: "Pluto TV Kids 2", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/51c75f7bb6f26ba1cd00002f/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Kids" },
  { id: "pluto-retro-toons", number: 354, name: "Pluto TV Retro Toons", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5c5c2b9d8002db3c3e0b1c6d/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Kids" },
  { id: "pluto-anime-1", number: 355, name: "Anime All Day 1", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5be4c6311843b56328bce619/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-anime-2", number: 356, name: "Anime All Day 2", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5812b7d3249444e05d09cc49/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },

  // News
  { id: "pluto-cnn", number: 357, name: "CNN", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5421f71da6af422839419cb3/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "News" },
  { id: "pluto-cbsn", number: 358, name: "CBSN", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5a6b92f6e22a617379789618/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "News" },
  { id: "pluto-bloomberg", number: 359, name: "Bloomberg TV", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/54ff7ba69222cb1c2624c584/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "News" },
  { id: "pluto-news", number: 360, name: "Pluto TV News", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5268abcd0ce20a8472000114/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "News" },
  { id: "pluto-cnet", number: 361, name: "CNET", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/56283c8769ba54637dea0464/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "News" },

  // Music
  { id: "pluto-mtv-spankin", number: 362, name: "MTV Spankin' New", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5d14fdb8ca91eedee1633117/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Music" },
  { id: "pluto-mtv-biggest", number: 363, name: "MTV Biggest Pop", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5d14fd1a252d35decbc4080c/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Music" },
  { id: "pluto-yo-mtv", number: 364, name: "Yo! MTV", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5d14fc31252d35decbc4080b/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Music" },
  { id: "pluto-vevo-pop", number: 365, name: "Vevo Pop", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5d93b635b43dd1a399b39eee/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Music" },
  { id: "pluto-vevo-country", number: 366, name: "Vevo Country", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5da0d75e84830900098a1ea0/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Music" },

  // TV Shows
  { id: "pluto-star-trek", number: 367, name: "Star Trek", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5efbd29e4aa26700076c0d06/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-csi", number: 368, name: "CSI", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5efbd29e4aa26700076c0d06/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-cops", number: 369, name: "COPS", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5e1f7e089f23700009d66303/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-hells-kitchen", number: 370, name: "Hell's Kitchen", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5e6f38792075160007d85823/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-naruto", number: 371, name: "Naruto", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5da0c85bd2c9c10009370984/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-doctor-who", number: 372, name: "Doctor Who Classic", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5ce4475cd43850831ca91ce7/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-unsolved", number: 373, name: "Unsolved Mysteries", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5b4e96a0423e067bd6df6901/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-fear-factor", number: 374, name: "Fear Factor", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/588128d17d64bc0d0f385c34/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
  { id: "pluto-mythbusters", number: 375, name: "Mythbusters", url: "http://stitcher-ipv4.pluto.tv/v1/stitch/embed/hls/channel/5bd833b41843b56328bac189/master.m3u8?deviceType=samsung-tvplus&deviceMake=samsung&deviceModel=samsung&deviceVersion=unknown&appVersion=unknown&deviceLat=0&deviceLon=0&deviceDNT=0&deviceId=channel&advertisingId=channel&us_privacy=1YNY&embedPartner=samsung-tvplus", category: "Entertainment" },
];

// Combine all channels
export const allChannels: Channel[] = [
  ...originalChannels,
  ...horrorChannels,
  ...plutoChannels,
];

// Helper functions
export function getChannelsByCategory(category: Category): Channel[] {
  if (category === 'All') return allChannels;
  return allChannels.filter(ch => ch.category === category);
}

export function searchChannels(query: string): Channel[] {
  const lowerQuery = query.toLowerCase();
  return allChannels.filter(ch => 
    ch.name.toLowerCase().includes(lowerQuery) ||
    ch.category.toLowerCase().includes(lowerQuery)
  );
}
