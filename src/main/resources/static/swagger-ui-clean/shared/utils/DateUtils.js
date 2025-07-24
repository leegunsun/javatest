/**
 * 날짜 관련 유틸리티 함수들
 */
export class DateUtils {
  /**
   * 두 날짜 사이의 일수 차이를 계산합니다
   * @param {Date|string} date1 
   * @param {Date|string} date2 
   * @returns {number}
   */
  static getDaysDifference(date1, date2 = new Date()) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    const timeDiff = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * 날짜가 특정 기간 내에 있는지 확인합니다
   * @param {Date|string} date 
   * @param {number} days 
   * @returns {boolean}
   */
  static isWithinDays(date, days) {
    return this.getDaysDifference(date) <= days;
  }

  /**
   * 날짜를 상대적 시간으로 표현합니다 (예: "3일 전", "1주일 전")
   * @param {Date|string} date 
   * @returns {string}
   */
  static getRelativeTime(date) {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now - targetDate) / 1000);

    if (diffInSeconds < 60) {
      return '방금 전';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}분 전`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}시간 전`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}일 전`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months}개월 전`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years}년 전`;
    }
  }

  /**
   * 날짜를 형식화합니다
   * @param {Date|string} date 
   * @param {string} format - 'YYYY-MM-DD', 'YYYY/MM/DD', 'MM/DD/YYYY' 등
   * @returns {string}
   */
  static formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'YYYY/MM/DD':
        return `${year}/${month}/${day}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      default:
        return d.toLocaleDateString();
    }
  }

  /**
   * 현재 시간을 ISO 문자열로 반환합니다
   * @returns {string}
   */
  static getCurrentISOString() {
    return new Date().toISOString();
  }

  /**
   * 날짜가 유효한지 확인합니다
   * @param {*} date 
   * @returns {boolean}
   */
  static isValidDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  /**
   * 날짜를 한국 시간대로 변환합니다
   * @param {Date|string} date 
   * @returns {Date}
   */
  static toKoreanTime(date) {
    const d = new Date(date);
    const koreanTime = new Date(d.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return koreanTime;
  }

  /**
   * 두 날짜가 같은 날인지 확인합니다
   * @param {Date|string} date1 
   * @param {Date|string} date2 
   * @returns {boolean}
   */
  static isSameDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  /**
   * 날짜가 오늘인지 확인합니다
   * @param {Date|string} date 
   * @returns {boolean}
   */
  static isToday(date) {
    return this.isSameDay(date, new Date());
  }

  /**
   * 날짜가 어제인지 확인합니다
   * @param {Date|string} date 
   * @returns {boolean}
   */
  static isYesterday(date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.isSameDay(date, yesterday);
  }
}