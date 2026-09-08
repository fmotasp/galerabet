import React from 'react';
import { Trash2, Check } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { TaskModalHeader } from './components/TaskModalHeader';
import { TaskStatusAndDates } from './components/TaskStatusAndDates';
import { TaskMembersAndClients } from './components/TaskMembersAndClients';
import { TaskDescriptionSection } from './components/TaskDescriptionSection';
import { TaskReferenceImagesSection } from './components/TaskReferenceImagesSection';
import { TaskCommentsSection } from './components/TaskCommentsSection';
import { TaskDriveAttachmentsTab } from './components/TaskDriveAttachmentsTab';
import { TaskActivityTimelineTab } from './components/TaskActivityTimelineTab';
import { TaskLightboxModal } from './components/TaskLightboxModal';
import { useTaskModalForm } from './hooks/useTaskModalForm';
import { useTaskDriveFiles } from './hooks/useTaskDriveFiles';

export const TaskModal: React.FC = () => {
  const {
    isNewTaskModalOpen,
    setIsNewTaskModalOpen,
    editingTask,
    setEditingTask,
    addTask,
    updateTask,
    deleteTask,
    projects,
    employees,
    currentSprint,
    fetchTrelloCardComments,
    addTrelloComment,
    deleteTrelloComment,
    fetchTrelloCardAttachments,
    deleteTrelloAttachment,
    trelloSettings,
    trelloLabels,
    spineStatuses,
    addToast,
    currentUser,
  } = useApp();

  const isOpen = isNewTaskModalOpen || editingTask !== null;

  const {
    activeDrawerTab,
    setActiveDrawerTab,
    loadingActions,
    formData,
    setFormData,
    comments,
    newCommentText,
    setNewCommentText,
    isPostingComment,
    attachments,
    setAttachments,
    loadingAttachments,
    isEditingDescription,
    setIsEditingDescription,
    currentDriveFolderId,
    setCurrentDriveFolderId,
    currentDriveFolderUrl,
    setCurrentDriveFolderUrl,
    referenceImages,
    isUploadingReference,
    uploadingReferenceName,
    previewingReference,
    setPreviewingReference,
    copiedLink,
    selectedLabels,
    taskMembers,
    timelineActions,
    handleShareTask,
    handleClose,
    handleAddMember,
    handleRemoveMember,
    handleToggleLabel,
    handleAddComment,
    handleDeleteComment,
    handleUploadReferenceImage,
    handleDeleteReferenceImage,
    handleSubmit,
  } = useTaskModalForm({
    isOpen,
    editingTask,
    setEditingTask,
    employees,
    projects,
    currentSprint,
    spineStatuses,
    trelloSettings,
    trelloLabels,
    currentUser,
    fetchTrelloCardComments,
    fetchTrelloCardAttachments,
    addTrelloComment,
    deleteTrelloComment,
    addTask,
    updateTask,
    setIsNewTaskModalOpen,
    addToast,
  });

  const {
    selectedAttachmentFiles,
    setSelectedAttachmentFiles,
    isPostingAttachment,
    uploadTotalCount,
    uploadProgressCount,
    openingDriveFolder,
    deletingFileIds,
    openAttachmentMenuId,
    setOpenAttachmentMenuId,
    handleUploadSelectedFileAttachment,
    handleOpenDeliveredFolder,
    handleDownloadSingleFile,
    handleRenameAttachment,
    handleToggleCoverImage,
    handleDeleteAttachment,
  } = useTaskDriveFiles({
    editingTask,
    currentDriveFolderId,
    setCurrentDriveFolderId,
    currentDriveFolderUrl,
    setCurrentDriveFolderUrl,
    attachments,
    setAttachments,
    updateTask,
    setEditingTask,
    deleteTrelloAttachment,
    addToast,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl h-full bg-[#101010] text-white shadow-2xl border-l border-[#2E2E2E] overflow-hidden flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
        {/* Header with Navigation Tabs */}
        <TaskModalHeader
          editingTask={editingTask}
          formData={formData}
          setFormData={setFormData}
          spineStatuses={spineStatuses}
          attachments={attachments}
          referenceImages={referenceImages}
          timelineActions={timelineActions}
          activeDrawerTab={activeDrawerTab}
          setActiveDrawerTab={setActiveDrawerTab}
          copiedLink={copiedLink}
          handleShareTask={handleShareTask}
          handleClose={handleClose}
        />

        {/* Tab 1: Details */}
        {activeDrawerTab === 'details' && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#101010]">
            {!editingTask && (
              <div className="w-full">
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Título da Tarefa <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-task-title"
                  type="text"
                  required
                  placeholder="Ex: Criar arte da Santa Ceia"
                  value={formData.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setFormData((prev) => ({ ...prev, title: newTitle }));
                  }}
                  className="w-full p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#E4007E] transition-all text-white placeholder-slate-400"
                />
              </div>
            )}

            <div className="space-y-4">
              <TaskStatusAndDates
                formData={formData}
                setFormData={setFormData}
                spineStatuses={spineStatuses}
              />

              <TaskMembersAndClients
                taskMembers={taskMembers}
                employees={employees}
                projects={projects}
                selectedLabels={selectedLabels}
                handleAddMember={handleAddMember}
                handleRemoveMember={handleRemoveMember}
                handleToggleLabel={handleToggleLabel}
              />
            </div>

            <TaskDescriptionSection
              description={formData.description}
              onChange={(val) => setFormData((prev) => ({ ...prev, description: val }))}
              isEditingDescription={isEditingDescription}
              setIsEditingDescription={setIsEditingDescription}
            />

            <TaskReferenceImagesSection
              referenceImages={referenceImages}
              isUploadingReference={isUploadingReference}
              uploadingReferenceName={uploadingReferenceName}
              deletingFileIds={deletingFileIds}
              driveFolderId={editingTask?.driveFolderId}
              driveFolderUrl={editingTask?.driveFolderUrl}
              onFileUpload={handleUploadReferenceImage}
              onDeleteReference={handleDeleteReferenceImage}
              onPreview={setPreviewingReference}
            />

            {editingTask && (
              <TaskCommentsSection
                comments={comments}
                newCommentText={newCommentText}
                setNewCommentText={setNewCommentText}
                isPostingComment={isPostingComment}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                currentUser={currentUser}
              />
            )}

            {/* Drawer Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#2E2E2E] mt-4">
              {editingTask ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Tem certeza que deseja excluir a tarefa "${formData.title}"?`)) {
                      deleteTask(editingTask.id);
                      handleClose();
                    }
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/20 transition-all active:scale-98 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Tarefa</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  id="btn-submit-task"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-xs font-black shadow-md shadow-[#E4007E]/25 transition-all active:scale-98 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Attachments / Drive Files */}
        {activeDrawerTab === 'attachments' && editingTask && (
          <TaskDriveAttachmentsTab
            editingTask={editingTask}
            attachments={attachments}
            loadingAttachments={loadingAttachments}
            selectedAttachmentFiles={selectedAttachmentFiles}
            setSelectedAttachmentFiles={setSelectedAttachmentFiles}
            isPostingAttachment={isPostingAttachment}
            uploadTotalCount={uploadTotalCount}
            uploadProgressCount={uploadProgressCount}
            openingDriveFolder={openingDriveFolder}
            deletingFileIds={deletingFileIds}
            openAttachmentMenuId={openAttachmentMenuId}
            setOpenAttachmentMenuId={setOpenAttachmentMenuId}
            handleOpenDeliveredFolder={handleOpenDeliveredFolder}
            handleUploadSelectedFileAttachment={handleUploadSelectedFileAttachment}
            handleDeleteAttachment={handleDeleteAttachment}
            handleRenameAttachment={handleRenameAttachment}
            handleDownloadSingleFile={handleDownloadSingleFile}
            handleToggleCoverImage={handleToggleCoverImage}
            setActiveDrawerTab={setActiveDrawerTab}
            setNewCommentText={setNewCommentText}
            onPreview={setPreviewingReference}
            addToast={addToast}
          />
        )}

        {/* Tab 3: History */}
        {activeDrawerTab === 'history' && editingTask && (
          <TaskActivityTimelineTab
            editingTask={editingTask}
            timelineActions={timelineActions}
            loadingActions={loadingActions}
          />
        )}
      </div>

      {/* Lightbox Modal */}
      <TaskLightboxModal
        previewingReference={previewingReference}
        onClose={() => setPreviewingReference(null)}
      />
    </div>
  );
};
