import { IconType } from "react-icons";
import { TbDog, TbCat, TbAlien, TbBallBowling, TbBombFilled, TbCarrot, TbCherryFilled, TbCactus, TbCloudRain, TbCoffee, TbCrown, TbDice1, TbDice2, TbDice3, TbDice4, TbDice5, TbDice6, TbFish, TbGhost, TbHeartFilled, TbIceCream, TbMeteor, TbOctagonFilled, TbPlane, TbPoo, TbSnowflake, } from 'react-icons/tb';

export const Icons: IconType[] = [TbDog, TbCat, TbAlien, TbBallBowling, TbBombFilled, TbCarrot, TbCherryFilled, TbCactus, TbCloudRain, TbCoffee, TbCrown, TbDice1, TbDice2, TbDice3, TbDice4, TbDice5, TbDice6, TbFish, TbGhost, TbHeartFilled, TbIceCream, TbMeteor, TbOctagonFilled, TbPlane, TbPoo, TbSnowflake,];

export const DEFAULT_ICON_NAME = "TbBallBowling";
export const DEFAULT_ICON_COLOR = "#000000";

export const ICON_COLORS: string[] = [
  "#000000", // 黒
  "#FF0000", // 赤
  "#FFA500", // 橙
  "#FFD700", // 黄
  "#9ACD32", // 黄緑
  "#008000", // 緑
  "#00BFFF", // 水色
  "#0000FF", // 青
  "#000080", // 紺
  "#800080", // 紫
  "#FF69B4", // ピンク
  "#8B4513", // 茶
];

export function getIconComponent(iconName: string | null | undefined): IconType | null {
  if (!iconName) return null;
  return Icons.find((icon) => icon.name === iconName) ?? null;
}
