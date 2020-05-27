START TRANSACTION;

DELIMITER ;
CREATE TABLE `extensions` (
  `id` int(11) NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'The mime type of the file, if the browser provided this information. An example would be "image/gif". ',
  `name` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

TRUNCATE TABLE `extensions`;


CREATE TABLE `files` (
  `id` int(11) NOT NULL,
  `upload_date` datetime DEFAULT NULL,
  `delete_date` datetime DEFAULT NULL,
  `hash__name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `hash__file` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `user_id` int(11) DEFAULT NULL,
  `real_name`  text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `extension__id` int(11) DEFAULT 0,
  `status__id` int(11) DEFAULT NULL ,
  `size` int(11) DEFAULT NULL COMMENT 'Bytes',
  `parent_folder__id` int(11) NOT NULL DEFAULT 1,
  `type` int(11) NOT NULL DEFAULT 1 COMMENT '1 - file; 2 - folder'
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

TRUNCATE TABLE `files`;

CREATE TABLE `public_links` (
  `id` int(11) NOT NULL,
  `link` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file__id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

TRUNCATE TABLE `public_links`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `email`) VALUES
(1, 'admin', '$2y$10$Ory/YWl8oPEMrvPq4kW11eSyoEAGZarhedVmChqZDiMFx2njXWVW2', 'admin@mail.ru');


ALTER TABLE `extensions`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `files`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `public_links`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);


ALTER TABLE `extensions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

ALTER TABLE `files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

ALTER TABLE `public_links`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

INSERT INTO `extensions` (`id`,`type`, `name`, `description`) VALUES (0, 'folder', '', '');

DELIMITER $$
CREATE PROCEDURE `selectInsertPublicLink` (IN `file__id_in` INT, IN `user__id_in` INT, IN `link_in` VARCHAR(255))  BEGIN
    IF NOT EXISTS
        (
        SELECT
            `id`
        FROM
            `public_links`
        WHERE
            `public_links`.`file__id` = file__id_in AND `public_links`.`link` = link_in
        LIMIT 1
    ) THEN
INSERT INTO `public_links`(`id`, `link`, `file__id`)
VALUES(NULL, link_in, file__id_in) ; 
END IF ;
END$$

COMMIT;

