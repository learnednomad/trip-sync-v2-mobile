import React, { createContext, useContext } from 'react';

import { Modal } from '@/components/ui/modal';
import { NotificationsPanel } from '@/components/ui/notifications';

import { useNavigationStore } from './navigation-store';

interface ModalConfig {
  id: string;
  component: React.ComponentType<any>;
  props?: any;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  closable?: boolean;
}

interface ModalManagerContextType {
  registerModal: (config: ModalConfig) => void;
  unregisterModal: (id: string) => void;
  openModal: (id: string, props?: any) => void;
  closeModal: () => void;
  isModalOpen: (id: string) => boolean;
}

const ModalManagerContext = createContext<ModalManagerContextType | null>(null);

/**
 * Global modal manager
 * Handles app-wide modal state and rendering
 */
export const ModalManagerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [registeredModals, setRegisteredModals] = React.useState<
    Map<string, ModalConfig>
  >(new Map());
  const [modalProps, setModalProps] = React.useState<any>({});

  const activeModal = useNavigationStore.use.activeModal();
  const closeModal = useNavigationStore.use.closeModal();
  const openModalAction = useNavigationStore.use.openModal();

  // Built-in modals
  const builtInModals: Map<string, ModalConfig> = new Map([
    [
      'notifications',
      {
        id: 'notifications',
        component: NotificationsPanel,
        size: 'lg',
        closable: true,
      },
    ],
  ]);

  const allModals = new Map([...builtInModals, ...registeredModals]);

  const contextValue: ModalManagerContextType = {
    registerModal: (config: ModalConfig) => {
      setRegisteredModals((prev) => new Map(prev).set(config.id, config));
    },

    unregisterModal: (id: string) => {
      setRegisteredModals((prev) => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    },

    openModal: (id: string, props?: any) => {
      setModalProps(props || {});
      openModalAction(id);
    },

    closeModal,

    isModalOpen: (id: string) => activeModal === id,
  };

  // Render active modal
  const renderActiveModal = () => {
    if (!activeModal) return null;

    const modalConfig = allModals.get(activeModal);
    if (!modalConfig) return null;

    const ModalComponent = modalConfig.component;
    const combinedProps = { ...modalConfig.props, ...modalProps };

    return (
      <Modal
        visible={true}
        onClose={modalConfig.closable !== false ? closeModal : undefined}
        size={modalConfig.size}
      >
        <ModalComponent {...combinedProps} />
      </Modal>
    );
  };

  return (
    <ModalManagerContext.Provider value={contextValue}>
      {children}
      {renderActiveModal()}
    </ModalManagerContext.Provider>
  );
};

/**
 * Hook for accessing modal manager
 */
export const useModalManager = (): ModalManagerContextType => {
  const context = useContext(ModalManagerContext);

  if (!context) {
    throw new Error(
      'useModalManager must be used within a ModalManagerProvider'
    );
  }

  return context;
};

/**
 * Hook for registering a modal component
 */
export const useRegisterModal = (config: ModalConfig) => {
  const { registerModal, unregisterModal } = useModalManager();

  React.useEffect(() => {
    registerModal(config);

    return () => {
      unregisterModal(config.id);
    };
  }, [config, registerModal, unregisterModal]);
};

/**
 * Hook for controlling specific modal
 */
export const useModal = (modalId: string) => {
  const { openModal, closeModal, isModalOpen } = useModalManager();

  return {
    open: (props?: any) => openModal(modalId, props),
    close: closeModal,
    isOpen: isModalOpen(modalId),
    toggle: (props?: any) => {
      if (isModalOpen(modalId)) {
        closeModal();
      } else {
        openModal(modalId, props);
      }
    },
  };
};
