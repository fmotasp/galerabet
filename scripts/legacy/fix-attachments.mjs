import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskDriveAttachmentsTab.tsx', 'utf8');

content = content.replace(
  "setActiveDrawerTab: (tab: 'details' | 'attachments' | 'history') => void;",
  "setActiveBottomTab: (tab: 'comments' | 'checklists' | 'attachments' | 'references' | 'history') => void;"
);

content = content.replace(
  "  setActiveDrawerTab,",
  "  setActiveBottomTab,"
);

content = content.replace(
  "setActiveDrawerTab('details');",
  "setActiveBottomTab('comments');"
);

fs.writeFileSync('src/components/modals/task/components/TaskDriveAttachmentsTab.tsx', content);

let modalContent = fs.readFileSync('src/components/modals/task/TaskModal.tsx', 'utf8');

const regex = /<TaskDriveAttachmentsTab[\s\S]*?editingTask=\{editingTask\}\s*\/>/;
const replacement = `<TaskDriveAttachmentsTab
                      attachments={attachments}
                      loadingAttachments={loadingAttachments}
                      isPostingAttachment={isPostingAttachment}
                      uploadTotalCount={uploadTotalCount}
                      uploadProgressCount={uploadProgressCount}
                      openingDriveFolder={openingDriveFolder}
                      deletingFileIds={deletingFileIds}
                      openAttachmentMenuId={openAttachmentMenuId}
                      setOpenAttachmentMenuId={setOpenAttachmentMenuId}
                      handleUploadSelectedFileAttachment={handleUploadSelectedFileAttachment}
                      handleOpenDeliveredFolder={handleOpenDeliveredFolder}
                      handleDownloadSingleFile={handleDownloadSingleFile}
                      handleRenameAttachment={handleRenameAttachment}
                      handleToggleCoverImage={handleToggleCoverImage}
                      handleDeleteAttachment={handleDeleteAttachment}
                      editingTask={editingTask}
                      selectedAttachmentFiles={selectedAttachmentFiles}
                      setSelectedAttachmentFiles={setSelectedAttachmentFiles}
                      setActiveBottomTab={setActiveBottomTab}
                      setNewCommentText={setNewCommentText}
                      onPreview={setPreviewingReference}
                      addToast={addToast}
                    />`;

modalContent = modalContent.replace(regex, replacement);

fs.writeFileSync('src/components/modals/task/TaskModal.tsx', modalContent);

