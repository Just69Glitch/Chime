export const saveFileState = async (fileHash: string, state: any) => {
  return window.userDatabase.saveFileState(fileHash, state);
};

export const getFileState = async (fileHash: string) => {
  return window.userDatabase.getFileState(fileHash);
};

export const saveSubtitle = async (fileHash: string, subtitleName: string, subtitleData: Buffer, language: string) => {
  return window.userDatabase.saveSubtitle(fileHash, subtitleName, subtitleData, language);
};

export const getSubtitle = async (fileHash: string, subtitleName: string) => {
  return window.userDatabase.getSubtitle(fileHash, subtitleName);
};

export const getAllSubtitles = async (fileHash: string) => {
  return window.userDatabase.getAllSubtitles(fileHash);
};
