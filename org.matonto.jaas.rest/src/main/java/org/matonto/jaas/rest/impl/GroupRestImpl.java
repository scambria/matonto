package org.matonto.jaas.rest.impl;

/*-
 * #%L
 * org.matonto.jaas.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.karaf.jaas.boot.ProxyLoginModule;
import org.apache.karaf.jaas.boot.principal.GroupPrincipal;
import org.apache.karaf.jaas.boot.principal.UserPrincipal;
import org.apache.karaf.jaas.config.JaasRealm;
import org.apache.karaf.jaas.modules.BackingEngine;
import org.apache.karaf.jaas.modules.BackingEngineFactory;
import org.matonto.jaas.rest.GroupRest;
import org.matonto.rest.util.ErrorUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.security.auth.login.AppConfigurationEntry;
import javax.ws.rs.core.Response;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component(immediate = true)
public class GroupRestImpl implements GroupRest {
    protected JaasRealm realm;
    protected Map<String, BackingEngineFactory> engineFactories = new HashMap<>();
    protected BackingEngine engine;
    private final Logger logger = LoggerFactory.getLogger(GroupRestImpl.class);
    static final String TOKEN_MODULE = "org.matonto.jaas.modules.token.TokenLoginModule";

    @Reference(target = "(realmId=matonto)")
    protected void setRealm(JaasRealm realm) {
        this.realm = realm;
    }

    @Reference(type = '*', dynamic = true)
    protected void addEngineFactory(BackingEngineFactory engineFactory) {
        this.engineFactories.put(engineFactory.getModuleClass(), engineFactory);
    }

    protected void removeEngineFactory(BackingEngineFactory engineFactory) {
        this.engineFactories.remove(engineFactory.getModuleClass());
    }

    @Activate
    protected void start() {
        // Get ApplicationConfigEntry
        AppConfigurationEntry entry = null;
        for (AppConfigurationEntry configEntry : realm.getEntries()) {
            if (configEntry.getOptions().get(ProxyLoginModule.PROPERTY_MODULE).equals(TOKEN_MODULE)) {
                entry = configEntry;
                break;
            }
        }

        if (entry == null) throw new IllegalStateException("TokenLoginModule not registered with realm.");

        // Get TokenBackingEngineFactory
        BackingEngineFactory engineFactory;
        if (engineFactories.containsKey(TOKEN_MODULE)) {
            engineFactory = engineFactories.get(TOKEN_MODULE);
        } else {
            throw new IllegalStateException("Cannot find BackingEngineFactory service for TokenLoginModule.");
        }

        engine = engineFactory.build(entry.getOptions());
    }

    @Modified
    protected void update() {
        start();
    }

    @Override
    public Response listGroups() {
        JSONObject obj = new JSONObject();
        engine.listGroups().forEach((groupPrincipal, string) ->
                obj.put(groupPrincipal.getName(), JSONArray.fromObject(string.split(","))));
        return Response.status(200).entity(obj.toString()).build();
    }

    @Override
    public Response createGroup(String groupName) {
        if (groupName == null) {
            throw ErrorUtils.sendError("Group name must be provided", Response.Status.BAD_REQUEST);
        }

        if (findGroup(groupName).isPresent()) {
            throw ErrorUtils.sendError("Group already exists", Response.Status.BAD_REQUEST);
        }

        engine.createGroup(groupName);
        logger.info("Created group " + groupName);
        return Response.ok().build();
    }

    @Override
    public Response getGroup(String groupName) {
        if (groupName == null) {
            throw ErrorUtils.sendError("Group name must be provided", Response.Status.BAD_REQUEST);
        }

        Map.Entry<GroupPrincipal, String> group = findGroup(groupName).orElseThrow(() ->
                ErrorUtils.sendError("Group not found", Response.Status.BAD_REQUEST));

        JSONObject obj = new JSONObject();
        obj.put("name", group.getKey().getName());
        obj.put("roles", JSONArray.fromObject(group.getValue().split(",")));
        return Response.status(200).entity(obj.toString()).build();
    }

    @Override
    public Response updateGroup(String groupName) {
        // TODO: Implement
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response deleteGroup(String groupName) {
        if (groupName == null) {
            throw ErrorUtils.sendError("Group name must be provided", Response.Status.BAD_REQUEST);
        }

        if (!findGroup(groupName).isPresent()) {
            throw ErrorUtils.sendError("Group not found", Response.Status.BAD_REQUEST);
        }

        // Engine will delete group when no users are left in it
        engine.listUsers().stream()
                .filter(userPrincipal -> isInGroup(userPrincipal, groupName))
                .map(UserPrincipal::getName)
                .forEach(user -> {
                    engine.deleteGroup(user, groupName);
                    logger.info("Deleting " + groupName + " from " + user);
                });
        logger.info("Deleted group " + groupName);

        return Response.ok().build();
    }

    @Override
    public Response getGroupRoles(String groupName) {
        if (groupName == null) {
            throw ErrorUtils.sendError("Group name must be provided", Response.Status.BAD_REQUEST);
        }

        Map.Entry<GroupPrincipal, String> group = findGroup(groupName).orElseThrow(() ->
                ErrorUtils.sendError("Group not found", Response.Status.BAD_REQUEST));

        JSONArray roles = JSONArray.fromObject(group.getValue().split(","));
        return Response.status(200).entity(roles.toString()).build();
    }

    @Override
    public Response addGroupRole(String groupName, String role) {
        if (groupName == null || role == null) {
            throw ErrorUtils.sendError("Both groupName and role must be provided", Response.Status.BAD_REQUEST);
        }

        if (!findGroup(groupName).isPresent()) {
            throw ErrorUtils.sendError("Group not found", Response.Status.BAD_REQUEST);
        }

        logger.info("Adding role " + role + " to group " + groupName);
        engine.addGroupRole(groupName, role);
        return Response.ok().build();
    }

    @Override
    public Response removeGroupRole(String groupName, String role) {
        if (groupName == null || role == null) {
            throw ErrorUtils.sendError("Both groupName and role must be provided", Response.Status.BAD_REQUEST);
        }

        if (!findGroup(groupName).isPresent()) {
            throw ErrorUtils.sendError("Group not found", Response.Status.BAD_REQUEST);
        }

        logger.info("Removing role " + role + " from group " + groupName);
        engine.deleteGroupRole(groupName, role);
        return Response.ok().build();
    }

    @Override
    public Response getGroupUsers(String groupName) {
        if (groupName == null) {
            throw ErrorUtils.sendError("Group name must be provided", Response.Status.BAD_REQUEST);
        }

        if (!findGroup(groupName).isPresent()) {
            throw ErrorUtils.sendError("Group not found", Response.Status.BAD_REQUEST);
        }

        List<String> users = engine.listUsers().stream()
                .filter(userPrincipal -> isInGroup(userPrincipal, groupName))
                .map(UserPrincipal::getName)
                .collect(Collectors.toList());
        logger.info("Deleted group " + groupName);

        JSONArray usersJsonArray = JSONArray.fromObject(users);
        return Response.status(200).entity(usersJsonArray.toString()).build();
    }

    private Optional<Map.Entry<GroupPrincipal, String>> findGroup(String groupName) {
        Map<GroupPrincipal, String> groups = engine.listGroups();
        for (Map.Entry<GroupPrincipal, String> group : groups.entrySet()) {
            if (group.getKey().getName().equals(groupName)) {
                return Optional.of(group);
            }
        }
        return Optional.empty();
    }

    private boolean isInGroup(UserPrincipal user, String groupName) {
        List<GroupPrincipal> groups = engine.listGroups(user);
        for (GroupPrincipal group : groups) {
            if (group.getName().equals(groupName)) {
                logger.info("User " + user.getName() + " is in " + groupName);
                return true;
            }
        }
        logger.info("User " + user.getName() + " is not in " + groupName);
        return false;
    }
}
