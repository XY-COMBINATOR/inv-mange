import accountBalanceWallet from '@material-symbols/svg-400/outlined/account_balance_wallet.svg?raw';
import add from '@material-symbols/svg-400/outlined/add.svg?raw';
import addCircle from '@material-symbols/svg-400/outlined/add_circle.svg?raw';
import arrowDropDown from '@material-symbols/svg-400/outlined/arrow_drop_down.svg?raw';
import arrowForward from '@material-symbols/svg-400/outlined/arrow_forward.svg?raw';
import calendarToday from '@material-symbols/svg-400/outlined/calendar_today.svg?raw';
import call from '@material-symbols/svg-400/outlined/call.svg?raw';
import category from '@material-symbols/svg-400/outlined/category.svg?raw';
import chat from '@material-symbols/svg-400/outlined/chat.svg?raw';
import check from '@material-symbols/svg-400/outlined/check.svg?raw';
import checkCircle from '@material-symbols/svg-400/outlined/check_circle.svg?raw';
import close from '@material-symbols/svg-400/outlined/close.svg?raw';
import contrast from '@material-symbols/svg-400/outlined/contrast.svg?raw';
import darkMode from '@material-symbols/svg-400/outlined/dark_mode.svg?raw';
import database from '@material-symbols/svg-400/outlined/database.svg?raw';
import deleteIcon from '@material-symbols/svg-400/outlined/delete.svg?raw';
import doNotDisturbOn from '@material-symbols/svg-400/outlined/do_not_disturb_on.svg?raw';
import download from '@material-symbols/svg-400/outlined/download.svg?raw';
import edit from '@material-symbols/svg-400/outlined/edit.svg?raw';
import error from '@material-symbols/svg-400/outlined/error.svg?raw';
import filterAltOff from '@material-symbols/svg-400/outlined/filter_alt_off.svg?raw';
import history from '@material-symbols/svg-400/outlined/history.svg?raw';
import inbox from '@material-symbols/svg-400/outlined/inbox.svg?raw';
import info from '@material-symbols/svg-400/outlined/info.svg?raw';
import inventory2 from '@material-symbols/svg-400/outlined/inventory_2.svg?raw';
import lightMode from '@material-symbols/svg-400/outlined/light_mode.svg?raw';
import localShipping from '@material-symbols/svg-400/outlined/local_shipping.svg?raw';
import mail from '@material-symbols/svg-400/outlined/mail.svg?raw';
import moreVert from '@material-symbols/svg-400/outlined/more_vert.svg?raw';
import openInNew from '@material-symbols/svg-400/outlined/open_in_new.svg?raw';
import productionQuantityLimits from '@material-symbols/svg-400/outlined/production_quantity_limits.svg?raw';
import remove from '@material-symbols/svg-400/outlined/remove.svg?raw';
import restartAlt from '@material-symbols/svg-400/outlined/restart_alt.svg?raw';
import schedule from '@material-symbols/svg-400/outlined/schedule.svg?raw';
import search from '@material-symbols/svg-400/outlined/search.svg?raw';
import searchOff from '@material-symbols/svg-400/outlined/search_off.svg?raw';
import send from '@material-symbols/svg-400/outlined/send.svg?raw';
import settings from '@material-symbols/svg-400/outlined/settings.svg?raw';
import smartToy from '@material-symbols/svg-400/outlined/smart_toy.svg?raw';
import sort from '@material-symbols/svg-400/outlined/sort.svg?raw';
import spaceDashboard from '@material-symbols/svg-400/outlined/space_dashboard.svg?raw';
import swapVert from '@material-symbols/svg-400/outlined/swap_vert.svg?raw';
import tune from '@material-symbols/svg-400/outlined/tune.svg?raw';
import warning from '@material-symbols/svg-400/outlined/warning.svg?raw';

import checkCircleFill from '@material-symbols/svg-400/outlined/check_circle-fill.svg?raw';
import errorFill from '@material-symbols/svg-400/outlined/error-fill.svg?raw';
import infoFill from '@material-symbols/svg-400/outlined/info-fill.svg?raw';
import inventory2Fill from '@material-symbols/svg-400/outlined/inventory_2-fill.svg?raw';
import warningFill from '@material-symbols/svg-400/outlined/warning-fill.svg?raw';

const OUTLINED = {
  account_balance_wallet: accountBalanceWallet,
  add,
  add_circle: addCircle,
  arrow_drop_down: arrowDropDown,
  arrow_forward: arrowForward,
  calendar_today: calendarToday,
  call,
  category,
  chat,
  check,
  check_circle: checkCircle,
  close,
  contrast,
  dark_mode: darkMode,
  database,
  delete: deleteIcon,
  do_not_disturb_on: doNotDisturbOn,
  download,
  edit,
  error,
  filter_alt_off: filterAltOff,
  history,
  inbox,
  info,
  inventory_2: inventory2,
  light_mode: lightMode,
  local_shipping: localShipping,
  mail,
  more_vert: moreVert,
  open_in_new: openInNew,
  production_quantity_limits: productionQuantityLimits,
  remove,
  remove_circle: doNotDisturbOn,
  restart_alt: restartAlt,
  schedule,
  search,
  search_off: searchOff,
  send,
  settings,
  smart_toy: smartToy,
  sort,
  space_dashboard: spaceDashboard,
  swap_vert: swapVert,
  tune,
  warning,
};

const FILLED = {
  check_circle: checkCircleFill,
  error: errorFill,
  info: infoFill,
  inventory_2: inventory2Fill,
  warning: warningFill,
};

export function Icon({
  name,
  size = 24,
  filled = false,
  className = '',
  style,
}) {
  const svg = (filled && FILLED[name]) || OUTLINED[name];
  if (!svg) return null;

  return (
    <span
      aria-hidden="true"
      className={`md-icon ${className}`.trim()}
      style={{ width: `${size}px`, height: `${size}px`, ...style }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
